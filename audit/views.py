import os, json, datetime
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

        selected_plan_id = request.GET.get("plan_id") or request.POST.get("plan_id")
        selected_plan = None
        procesos, lugares, clausulass = [], [], set()
        results = {}
        standard = None

        # Si hay un plan seleccionado
        if selected_plan_id:
            try:
                selected_plan = AuditPlan.objects.get(id=selected_plan_id, organization_id=request.user.organization)
                contenido = selected_plan.plan_content.get("tabla-planAud", [])
                standard = selected_plan.plan_content.get("selected_clause")
                
                dependency = None
                if contenido and len(contenido[0]) > 1:  # primera fila y columna índice 1
                    dependency = contenido[0][1]  # el valor del "area" desde el plan de auditoria

                if not standard:
                    messages.error(request, "No se especificó el estándar en el plan de auditoría.")
                    return redirect("home")

                for fila in contenido:
                    procesos.append(fila[0])
                    lugares.append(fila[2])
                    clausulass.add(fila[4])

                separadas = [item.split(', ') for item in clausulass]
                separadas_plana = [x for sublist in separadas for x in sublist]

                json_path = os.path.join(settings.BASE_DIR, 'static', 'data', standard)
                with open(json_path, 'r', encoding="utf-8") as f:
                    json_data = json.load(f)

                for item in separadas_plana:
                    item = str(item)
                    if item in json_data["clausula"]:
                        results[item] = json_data["clausula"][item]

            except AuditPlan.DoesNotExist:
                messages.error(request, "El plan seleccionado no existe.")
                return redirect("check_lists")

        # AJAX para cargar preguntas de una cláusula
        if request.method == "POST" and request.headers.get("x-requested-with") == "XMLHttpRequest":
            selected_key = request.POST.get("selected_key")
            selected_value = clausulas.get(selected_key, "")
            preguntas = subpreguntas.get(selected_key, {})

            preguntas_formateadas = [
                {"indice": k, "pregunta": v} for k, v in preguntas.items()
            ]

            return JsonResponse({
                "key": selected_key,
                "value": selected_value,
                "preguntas": preguntas_formateadas,
            })

        return render(
            request,
            "checkLists.html",
            {
                "clausulas": clausulas,
                "subpreguntas": subpreguntas,
                "organizacion": request.user.organization,
                "procesos": procesos,
                "lugares": lugares,
                "clauses": results,
                "planes": planes,
                "plan_seleccionado": int(selected_plan_id) if selected_plan_id else None,
            }
        )
    else:
        messages.warning(request, _("No tienes acceso"))
        return redirect('home')


@csrf_exempt
def save_checklist(request):
    if request.method == "POST":
        data = json.loads(request.body)

        selected_plan = AuditPlan.objects.filter(organization=request.user.organization).last()
        plan_content = selected_plan.plan_content if selected_plan else {}
        tabla_planAud = plan_content.get("tabla-planAud", [])

        dependency = None
        if tabla_planAud and len(tabla_planAud[0]) > 1:
            dependency = tabla_planAud[0][1] # el valor del "area" desde el plan de auditoria

        checklist = CheckList.objects.create(
            process=data.get("process"),
            place=data.get("place"),
            clauses_list=data.get("clauses_list"),
            audit_data=data.get("audit_data"),
            organization_id = request.user.organization.id,
            dependency = dependency,
            leader_auditor=request.user,
            process_type=data.get("process_type"),
        )
        return JsonResponse({"status": "ok", "id": checklist.id})

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


