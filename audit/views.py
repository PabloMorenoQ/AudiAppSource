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
        organization_id = 1
        leader_auditor_id = 1
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
                clauses.append(fila[5])
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
        messages.warning(request, "No tienes acceso")
        return redirect('home')
    

def check_lists(request):
    if request.user.is_authenticated and request.user.role in ['auditUser', 'auditLeaderUser', 'superUser']:
        content = send_content()
        clausulas = content.get("clausula", {})
        subpreguntas = content.get("subpreguntas", {})
        plan = AuditPlan.objects.filter(organization_id=request.user.organization).last()
        
        procesos = []
        lugares =[]
        clausulass = set()

        contenido = plan.plan_content.get("tabla-planAud", [])
        standard = plan.plan_content.get("selected_clause")
        for fila in contenido:
            procesos.append(fila[0])   
            lugares.append(fila[2])
            clausulass.add(fila[4])

        separadas = [item.split(', ') for item in clausulass]
        separadas_plana = [x for sublist in separadas for x in sublist]

        results = {}
        json_path = os.path.join(settings.BASE_DIR, 'static', 'data', standard)
        with open(json_path, 'r', encoding="utf-8") as f:
            json_data = json.load(f)
            
        for item in separadas_plana:
            item = str(item)
            if item in json_data["clausula"]:
                results[item] = json_data["clausula"][item]

        if request.method == "POST":
            selected_key = request.POST.get("selected_key")
            selected_value = clausulas.get(selected_key, "")
            preguntas = subpreguntas.get(selected_key, {})

            # Formatea las preguntas en una lista de diccionarios
            preguntas_formateadas = [
                {"indice": k, "pregunta": v} for k, v in preguntas.items()
            ]

            return JsonResponse(
                {
                    "key": selected_key,
                    "value": selected_value,
                    "preguntas": preguntas_formateadas,
                }
            )

        return render(
            request, "checkLists.html", {"clausulas": clausulas, "subpreguntas": subpreguntas, 
                                         "organizacion": request.user.organization,
                                         "procesos": procesos,
                                         "lugares": lugares,
                                         'clauses': results}
        )

    else:
        messages.warning(request, "No tienes acceso")
        return redirect('home')

@csrf_exempt
# @login_required
def save_checklist(request):
    if request.method == "POST":
        data = json.loads(request.body)

        checklist = CheckList.objects.create(
            process=data.get("process"),
            place=data.get("place"),
            clauses_list=data.get("clauses_list"),
            audit_data=data.get("audit_data"),
            # organization_instance = Organization.objects.get(id=request.user.organization.id)
            organization_id = 1,
            dependency="Temporal",  # Cambiar si viene del form
            # leader_auditor=request.user
            leader_auditor= User.objects.get(id=1),
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
            organization_id =1,
            # leader_auditor=User.objects.get(id=data['leader_auditor_id']),
            leader_auditor = User.objects.get(id=1),
            # clauses_list = data.get('clauses_list'),
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
        # report.save()

        return JsonResponse({"status": "ok", "report_id": report.id})

    return JsonResponse({"error": "Metodo no permitido"}, status=405)

def reports(request):
    if request.user.is_authenticated and request.user.role in ['auditLeaderUser', 'superUser']:
        return render(request, "reports.html")
    else:
        messages.warning(request, "No tienes acceso")
        return redirect('home')

def send_content():
    data_file = f"content_55001_2024_es.json"
    route = os.path.join(settings.BASE_DIR, "static" , "data", data_file)

    with open(route, encoding="utf-8") as f:
        content = json.load(f)

    return content

def excel_landing(request):
    if request.user.is_authenticated and request.user.role in ['auditLeaderUser', 'superUser']:
        if request.method == "GET":
            checklists = CheckList.objects.filter(leader_auditor=request.user)  # o .all() si querés todas
            return render(request, "excel.html", {"checklists": checklists})
        else:
            return render(request, "home.html")

@csrf_exempt
def download_excel(request):
    if request.user.is_authenticated and request.user.role in ['auditLeaderUser', 'superUser']:
        # if request.method == "GET":
        #     return render(request, "excel.html")
        
        if request.method == "POST":
            try:
                data = json.loads(request.body)
                checklist_id = data.get("checklist_id")
                checklist = CheckList.objects.get(id=checklist_id)

                audit_data = checklist.audit_data
                if isinstance(audit_data, str):
                    audit_data = json.loads(audit_data)

                df = pd.DataFrame(audit_data)

                output = BytesIO()
                with pd.ExcelWriter(output, engine="openpyxl") as writer:
                    df.to_excel(writer, index=False, sheet_name="Auditoría")

                    # Agregar otra hoja con metadatos si se desea
                    metadata = {
                        "Proceso": [checklist.process],
                        "Lugar": [checklist.place],
                        "Organización": [checklist.organization.name],
                        "Auditor Líder": [checklist.leader_auditor.first_name],
                        "Tipo de Proceso": [checklist.process_type],
                        "Cláusulas": [checklist.clauses_list]
                    }
                    meta_df = pd.DataFrame(metadata)
                    meta_df.to_excel(writer, index=False, sheet_name="Resumen")

                response = HttpResponse(
                    output.getvalue(),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
                response["Content-Disposition"] = f'attachment; filename=checklist_{checklist.id}.xlsx'
                return response

            except CheckList.DoesNotExist:
                return JsonResponse({"error": "Checklist no encontrada"}, status=404)
            except Exception as e:
                return JsonResponse({"error": str(e)}, status=500)

        return JsonResponse({"error": "Método no permitido"}, status=405)