import os, json, datetime
import pandas as pd
from io import BytesIO

from django.shortcuts import render, redirect
from .templates import *
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from .models import AuditPlan, CheckList
from accounts.models import Organization, User
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages


@csrf_exempt
def audit_plan(request):
    if request.user.is_authenticated and request.user.role in ['auditLeaderUser', 'superUser']:
        if request.method == "GET":
            return render(request, "auditPlan.html")

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
    """Muestra listas de verificación y permite obtener información específica
    según la selección del usuario. Retorna un JSON con preguntas asociadas
    si la solicitud es POST."""
    if request.user.is_authenticated and request.user.role in ['auditUser', 'auditLeaderUser', 'superUser']:
        content = send_content()
        clausulas = content.get("clausula", {})
        subpreguntas = content.get("subpreguntas", {})

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
            request, "checkLists.html", {"clausulas": clausulas, "subpreguntas": subpreguntas}
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

def download_excel(request):
    if request.method == "POST":
        try:
            # Supongamos que recibís el JSON desde el body
            data = json.loads(request.body).get("audit_data", [])

            # Si viene como string JSON desde DB
            if isinstance(data, str):
                data = json.loads(data)

            # Convertir en DataFrame
            df = pd.DataFrame(data)

            # Crear archivo en memoria
            output = BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, sheet_name="Auditoría")

            # Preparar respuesta
            response = HttpResponse(
                output.getvalue(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            response["Content-Disposition"] = 'attachment; filename="auditoria.xlsx"'
            return response

        except Exception as e:
            return HttpResponse(f"Error: {str(e)}", status=400)

    return HttpResponse("Método no permitido", status=405)