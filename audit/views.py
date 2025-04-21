import os
import json
from django.shortcuts import render, redirect
from .templates import *
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from django.contrib import messages

# Create your views here.
def audit_plan(request):
    if request.user.is_authenticated and request.user.role in ['auditLeaderUser', 'superUser']:
        return render(request, "auditPlan.html")
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