import os
import json

from django.shortcuts import render
from .templates import *
from django.http import HttpResponse, JsonResponse
from django.conf import settings

# Create your views here.
def audit_plan(request):
    return render(request, "auditPlan.html")

def check_lists(request):
    """Muestra listas de verificación y permite obtener información específica
    según la selección del usuario. Retorna un JSON con preguntas asociadas
    si la solicitud es POST."""
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


def reports(request):
    return render(request, "reports.html")

def send_content():
    data_file = f"content_55001_2024_es.json"
    route = os.path.join(settings.BASE_DIR, "static" , "data", data_file)

    with open(route, encoding="utf-8") as f:
        content = json.load(f)

    return content