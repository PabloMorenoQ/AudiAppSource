import os, json, datetime, re
import pandas as pd
from io import BytesIO
from django.shortcuts import render, redirect
from .templates import *
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from .models import AuditPlan, CheckList, Report
from accounts.models import Organization, User
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.utils.dateparse import parse_date
from django.utils.translation import gettext as _
from pathlib import Path

from AudiApp import settings


@csrf_exempt
def audit_plan(request):
    if request.user.is_authenticated and request.user.role in ['auditLeaderUser', 'superUser']:
        if request.method == "GET":
            data_path = os.path.join(settings.BASE_DIR, 'static', 'data')
            standards = []
            for file in os.listdir(data_path):
                if file.endswith(".json"):
                    filename = file
                    base_name = os.path.splitext(file)[0]
                    parts = base_name.split("_")
                    
                    if len(parts) == 4:
                        standard = parts[1]
                        year = parts[2]
                        language = parts[3]
                        name = f"Norma {standard} ({year}, {language})"
                    else:
                        name = filename

                    standards.append({"file": filename, "name": name})
            return render(request, "auditPlan.html", {"standards": standards})
            
        # POST:
        creation_date = datetime.date.today()
        organization_id = request.user.organization.id
        leader_auditor_id = request.user.id
        # organization_id = request.POST.get("organization")     # pedir desde el middleware 
        # leader_auditor_id = request.POST.get("leader_auditor") # para cargar datos de usuario

        raw_plan = request.POST.get("plan_content", "{}")
        try:
            plan_content = json.loads(raw_plan)
        except json.JSONDecodeError:
            return JsonResponse({"error": "plan_content no es JSON válido"}, status=400)

        selected_clause = request.POST.get("clausula")
        plan_content["selected_clause"] = selected_clause
        filas = plan_content.get("tabla-planAud", [])
        clauses = []
        for fila in filas:
            if len(fila) >= 6:
                clauses.append(fila[4])
        # Unir en un solo string, separado por comas o saltos de línea
        clauses_list = "\n".join(clauses)

        plan = AuditPlan.objects.create(
            creation_date = creation_date,
            organization_id = organization_id,
            leader_auditor_id = leader_auditor_id,
            clauses_list = clauses_list,
            plan_content = plan_content,
        )
        return JsonResponse(plan.export(), safe=False)
        # return render(request, "auditPlan.html")
    else:
        messages.warning(request, _("No tienes acceso"))
        return redirect('home')
    

def check_lists(request):
    if request.user.is_authenticated and request.user.role in ['auditUser', 'auditLeaderUser', 'superUser']:
        content = send_content()
        clausulas = content.get("clausula", {})
        subpreguntas = content.get("subpreguntas", {})

        # Obtener todos los planes de la organización
        planes = AuditPlan.objects.filter(organization_id=request.user.organization)
        if not planes.exists():
            messages.error(request, "No hay un plan de auditoría asignado.")
            return redirect("home")

        # ✅ INICIALIZAR TODAS LAS VARIABLES ANTES DE CUALQUIER CONDICIONAL
        selected_plan_id = request.GET.get("plan_id") or request.POST.get("plan_id")
        selected_plan = None
        procesos = []
        lugares = []
        clausulass = set()
        results = {}
        standard = None
        proceso_clausulas = {}
        iso_values_normalized = {}
        proceso_lugar_map = {}
        dependency = None

        # ==============================
        # Si hay un plan seleccionado
        # ==============================
        if selected_plan_id:
            try:
                selected_plan = AuditPlan.objects.get(
                    id=selected_plan_id,
                    organization_id=request.user.organization
                )
                contenido = selected_plan.plan_content.get("tabla-planAud", [])
                standard = selected_plan.plan_content.get("selected_clause")

                if not standard:
                    messages.error(request, "No se especificó el estándar en el plan de auditoría.")
                    return redirect("home")

                # ✅ CONSTRUIR TODO EN UN SOLO BUCLE
                for fila in contenido:
                    proceso_nombre = fila[0]
                    dependency = fila[1]
                    lugar_nombre = fila[2]
                    clausulas_str = fila[4]
                    
                    # Agregar a listas para el template
                    procesos.append(proceso_nombre)
                    lugares.append(lugar_nombre)
                    clausulass.add(clausulas_str)
                    
                    # Construir diccionario proceso → lugar
                    proceso_lugar_map[proceso_nombre] = lugar_nombre
                    
                    # Construir diccionario proceso → cláusulas
                    clausulas_list = [c.strip() for c in clausulas_str.split(',') if c.strip()]
                    
                    if proceso_nombre not in proceso_clausulas:
                        proceso_clausulas[proceso_nombre] = []
                    proceso_clausulas[proceso_nombre].extend(clausulas_list)
                
                # Eliminar duplicados en las cláusulas de cada proceso
                proceso_clausulas = {k: list(set(v)) for k, v in proceso_clausulas.items()}

                # Separar todas las cláusulas únicas
                separadas = [re.split(r',\s*', item) for item in clausulass]
                separadas_plana = [x.strip() for sublist in separadas for x in sublist if x.strip()]

                # Cargar JSON del estándar
                json_path = os.path.join(settings.BASE_DIR, 'static', 'data', standard)
                with open(json_path, 'r', encoding="utf-8") as f:
                    json_data = json.load(f)

                # Normalizar claves del JSON
                json_keys = {str(k).strip(): v for k, v in json_data["clausula"].items()}

                # ✅ Cargar ISO_value si existe
                iso_values = json_data.get("ISO_value", {})
                iso_values_normalized = {str(k).strip(): v for k, v in iso_values.items()}


                # Construir resultados con coincidencias exactas
                results = {}
                for item in separadas_plana:
                    item = str(item).strip()
                    if item in json_keys:
                        results[item] = json_keys[item]

            except AuditPlan.DoesNotExist:
                messages.error(request, "El plan seleccionado no existe.")
                return redirect("check_lists")
            except FileNotFoundError:
                messages.error(request, f"No se encontró el archivo del estándar: {standard}")
                return redirect("check_lists")
            except Exception as exc:
                messages.error(request, f"Error al cargar el plan: {str(exc)}")
                return redirect("check_lists")

        # ==========================================================
        # AJAX para cargar preguntas de una cláusula específica
        # ==========================================================
        if request.method == "POST" and request.headers.get("x-requested-with") == "XMLHttpRequest":
            selected_key = request.POST.get("selected_key", "").strip()
            ajax_plan_id = request.POST.get("plan_id") or selected_plan_id

            preguntas = {}
            selected_value = ""

            # Si tenemos un plan_id, cargamos el JSON correspondiente
            if ajax_plan_id:
                try:
                    plan_ajax = AuditPlan.objects.get(
                        id=ajax_plan_id,
                        organization_id=request.user.organization
                    )

                    standard_ajax = plan_ajax.plan_content.get("selected_clause")
                    json_path_ajax = os.path.join(settings.BASE_DIR, 'static', 'data', standard_ajax)

                    with open(json_path_ajax, 'r', encoding="utf-8") as f:
                        json_ajax_data = json.load(f)

                    clausulas_json = {str(k).strip(): v for k, v in json_ajax_data.get("clausula", {}).items()}
                    subpreguntas_json = {str(k).strip(): v for k, v in json_ajax_data.get("subpreguntas", {}).items()}

                    # Valor descriptivo de la cláusula
                    selected_value = clausulas_json.get(selected_key, "")

                    # Buscar coincidencia exacta
                    if selected_key in subpreguntas_json:
                        preguntas = subpreguntas_json[selected_key]
                    else:
                        # Buscar todas las subclaves que inicien con selected_key
                        coincidencias = {k: v for k, v in subpreguntas_json.items() if k.startswith(selected_key)}
                        if coincidencias:
                            preguntas = {}
                            for subk, subv in coincidencias.items():
                                preguntas[subk] = subv

                except AuditPlan.DoesNotExist:
                    pass
                except FileNotFoundError:
                    pass
                except Exception as exc:
                    print(f"Error en AJAX: {exc}")

            # Formatear preguntas para el frontend
            preguntas_formateadas = [
                {"indice": k, "pregunta": v} for k, v in preguntas.items()
            ]

            return JsonResponse({
                "key": selected_key,
                "value": selected_value,
                "preguntas": preguntas_formateadas,
            })

        # ==========================================================
        # Render normal (no AJAX)
        # ==========================================================
        return render(
            request,
            "checkLists.html",
            {
                "clausulas": clausulas,
                "subpreguntas": subpreguntas,
                "organizacion": request.user.organization,
                "procesos": procesos,
                "lugares": lugares,
                "dependency": dependency,
                "clauses": results,
                "planes": planes,
                "plan_seleccionado": int(selected_plan_id) if selected_plan_id else None,
                "proceso_clausulas": json.dumps(proceso_clausulas),
                "iso_value": json.dumps(iso_values_normalized),
                "proceso_lugar_json": json.dumps(proceso_lugar_map),
                "selected_standard": standard or "",
                "selected_plan_id": selected_plan_id, #toma el id del plan para vincularlo a la LV
            }
        )
    else:
        messages.warning(request, _("No tienes acceso"))
        return redirect('home')

@csrf_exempt
def save_checklist(request):
    if request.method == "POST":
        data = json.loads(request.body)
        
        # ✅ Obtener el plan_id desde el request
        plan_id = data.get("plan_id") or request.GET.get("plan_id")
        
        # ✅ Validar que el plan existe
        try:
            audit_plan = AuditPlan.objects.get(
                id=plan_id,
                organization=request.user.organization
            )
        except AuditPlan.DoesNotExist:
            return JsonResponse({
                "error": "Plan de auditoría no encontrado"
            }, status=404)
        
        # ✅ Crear checklist con el plan vinculado
        checklist = CheckList.objects.create(
            audit_plan=audit_plan,  # 👈 NUEVO
            process=data.get("process"),
            place=data.get("place"),
            clauses_list=data.get("clauses_list"),
            audit_data=data.get("audit_data"),
            organization_id=request.user.organization.id,
            dependency=data.get("dependency"),
            leader_auditor=request.user,
            process_type=data.get("process_type"),
        )
        
        return JsonResponse({
            "status": "ok",
            "id": checklist.id,
            "plan_id": audit_plan.id,
            "plan_name": str(audit_plan)
        })
    
    return JsonResponse({"error": "Método no permitido"}, status=405)

@csrf_exempt
def save_report(request):
    if request.method == "POST":        
        data = json.loads(request.body)

        report = Report.objects.create(
            creation_date= datetime.date.today(),
            organization_id = request.user.organization.id,
            leader_auditor= request.user,
            # leader_auditor = User.objects.get(id=1),
            clauses_list = data.get('clauses_list'),
            resumen_data = data.get('resumen'),
            fortalezas_data = data.get('fortalezas'),
            conformidades_data = data.get('conformidades'),
            recomendaciones_data = data.get('recomendaciones'),
            riesgos_data = data.get('riesgos'),
            no_conformidades_data = data.get('no_conformidades'),

            pertinencia_data = data.get('pertinencia'),
            adecuacion_data = data.get('adecuacion'),
            eficacia_data = data.get('eficacia'),
        )
        report.save()

        return JsonResponse({"status": "ok", "report_id": report.id})

    return JsonResponse({"error": "Metodo no permitido"}, status=405)

from django.utils.translation import gettext as _  # Asegurate de importar esto si usás traducción

def reports(request):
    if request.user.is_authenticated and request.user.role in ['auditLeaderUser', 'superUser']:
        # Obtener los checklists relacionados a la organización del usuario
        checklists = CheckList.objects.filter(organization=request.user.organization)

        sections = [
            ('fortalezas', _('Fortalezas')),
            ('conformidad', _('Conformidades')),
            ('riesgos', _('Riesgos')),
            ('recomendaciones', _('Recomendaciones')),
            ('no-conformidades', _('No Conformidades')),
        ]
        summary_sections = [
            ('pertinencia', _('Pertinencia'), _('Explicación de la pertinencia del proceso.')),
            ('adecuacion', _('Adecuación'), _('Explicación sobre la adecuación del proceso.')),
            ('eficacia', _('Eficacia'), _('Evaluación de la eficacia del proceso.')),
        ]
        return render(request, "reports.html", {
            'sections': sections,
            'summary_sections': summary_sections,
            'checklists': checklists  # <--- importante
        })
    else:
        messages.warning(request, _("No tienes acceso"))
        return redirect('home')


def send_content():
    data_file = f"content_55001_2024_es.json"
    route = os.path.join(settings.BASE_DIR, "static" , "data", data_file)

    with open(route, encoding="utf-8") as f:
        content = json.load(f)

    return content


def get_checklist_data(request, checklist_id):
    if not request.user.is_authenticated or request.user.role not in ['auditLeaderUser', 'superUser', 'organizationUser']:
        return JsonResponse({'success': False, 'error': 'No autorizado'}, status=403)

    try:
        checklist = CheckList.objects.get(id=checklist_id, organization=request.user.organization)

        audit_data = checklist.audit_data or []
        if isinstance(audit_data, str):
            try:
                audit_data = json.loads(audit_data)
            except json.JSONDecodeError:
                audit_data = []

        return JsonResponse({'success': True, 'data': audit_data})
    except CheckList.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Checklist no encontrada'}, status=404)


