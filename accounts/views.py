import os, json, datetime
import pandas as pd
from io import BytesIO

from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from django.contrib.auth.models import Group
from .forms import Register
from .models import User
from audit.models import AuditPlan, CheckList, Report  # Asegúrate que "audit" sea tu app correcta
from django.views.decorators.csrf import csrf_exempt
from django.utils.translation import gettext as _


# Vista de registro
def register_view(request):
    if request.method == 'POST':
        form = Register(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, _('Registro correcto'))
            return redirect('home')
        else:
            username = form.cleaned_data.get('username')
            if User.objects.filter(username=username).exists():
                messages.warning(request, _('El nombre de usuario ya está en uso.'))

            email = form.cleaned_data.get('email')
            if User.objects.filter(email=email).exists():
                messages.warning(request, _('El correo electrónico ya está registrado.'))

            password1 = form.cleaned_data.get('password1')
            password2 = form.cleaned_data.get('password2')
            if password1 != password2:
                messages.warning(request, _('Las contraseñas no coinciden.'))
    else:
        form = Register()
    return render(request, 'register.html', {'form': form})

# Vista de login
def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            nombre = form.cleaned_data.get('username')
            contraseña = form.cleaned_data.get('password')
            user = authenticate(request, username=nombre, password=contraseña)
            if user:
                messages.success(request, _("Inicio de sesión correcto"))
                login(request, user)
                return redirect('profile')
        else:
            messages.warning(request, _('Los datos son incorrectos'))
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form})

# Vista de perfil
def profile_view(request):
    if request.user.is_authenticated:
        return render(request, "profile.html")
    else:
        messages.info(request, _("Inicia sesión primero"))
        return redirect('login')

# Vista de logout
def logout_view(request):
    if request.method == 'POST':
        logout(request)
        messages.success(request, _("Cierre de sesión correcto"))
        return redirect('register')
    return redirect('register')

# Vista del Dashboard con edición y eliminación inline
def admin_dashboard(request):
    if not request.user.is_authenticated:
        messages.warning(request, _("Debes iniciar sesión para ver el dashboard."))
        return redirect('login')

    org = 1

    # Procesamiento de formularios POST
    if request.method == 'POST':
        form_type = request.POST.get('form_type')

        if form_type == 'edit_user':
            user_id = request.POST.get('user_id')
            user = get_object_or_404(User, id=user_id, organization=org)
            user.first_name = request.POST.get('first_name', user.first_name)
            user.last_name = request.POST.get('last_name', user.last_name)
            user.email = request.POST.get('email', user.email)
            user.role = request.POST.get('role', user.role)
            user.save()
            messages.success(request, _("Usuario %(username)s actualizado.") % {"username": user.username})


        elif form_type == 'delete_user':
            user_id = request.POST.get('user_id')
            user = get_object_or_404(User, id=user_id, organization=org)
            user.delete()
            messages.success(request, _(f"Usuario eliminado."))

        return redirect('admin_dashboard')

    context = {
        'users': User.objects.filter(organization=org),
        'audit_plans': AuditPlan.objects.filter(organization=org),
        'checklists': CheckList.objects.filter(organization=org).select_related("leader_auditor", "organization"),
        'reports': Report.objects.filter(organization=org),
        'groups': Group.objects.all(),
    }
    return render(request, 'dashboard.html', context)

@csrf_exempt
def download_excel_checklist(request):
    if request.user.is_authenticated and request.user.role in ['auditLeaderUser', 'superUser', 'organizationUser']:
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
    
@csrf_exempt
def download_excel_audit_plan(request):
    if not (request.user.is_authenticated and request.user.role in ['auditLeaderUser','superUser','organizationUser']):
        return JsonResponse({"error": "No autorizado"}, status=403)

    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        payload = json.loads(request.body)
        plan_id = payload.get("plan_id")
        plan = AuditPlan.objects.get(id=plan_id)

        # Datos principales
        content = plan.plan_content or []
        if isinstance(content, str):
            content = json.loads(content)

        df = pd.DataFrame(content)

        # Generar Excel en memoria
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Contenido Plan")

            # Hoja de metadatos
            meta = {
                "ID":             [plan.id],
                "Fecha":          [str(plan.creation_date)],
                "Organización":   [plan.organization.name],
                "Líder Auditor":  [plan.leader_auditor.get_full_name()],
                "Cláusulas":      [plan.clauses_list],
            }
            pd.DataFrame(meta).to_excel(writer, index=False, sheet_name="Resumen")

        resp = HttpResponse(
            output.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        resp["Content-Disposition"] = f'attachment; filename="audit_plan_{plan.id}.xlsx"'
        return resp

    except AuditPlan.DoesNotExist:
        return JsonResponse({"error": "Plan no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def download_excel_report(request):
    if not (request.user.is_authenticated and request.user.role in ['auditLeaderUser','superUser','organizationUser']):
        return JsonResponse({"error": "No autorizado"}, status=403)

    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        payload   = json.loads(request.body)
        report_id = payload.get("report_id")
        report    = Report.objects.get(id=report_id)

        # Construir DataFrames por sección
        sheets = {}
        # resumen_data es un JSON string → dict
        sheets["Resumen"] = pd.DataFrame([ json.loads(report.resumen_data) ])
        # Cada una es lista de dicts
        sheets["Fortalezas"]       = pd.DataFrame(json.loads(report.fortalezas_data))
        sheets["Conformidades"]    = pd.DataFrame(json.loads(report.conformidades_data))
        sheets["Recomendaciones"]  = pd.DataFrame(json.loads(report.recomendaciones_data))
        sheets["Riesgos"]          = pd.DataFrame(json.loads(report.riesgos_data))
        sheets["NoConformidades"]  = pd.DataFrame(json.loads(report.no_conformidades_data))

        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            for name, df in sheets.items():
                df.to_excel(writer, index=False, sheet_name=name)

            # Metadatos generales
            meta = {
                "ID Informe":      [report.id],
                "Fecha":           [str(report.creation_date)],
                "Organización":    [report.organization.name],
                "Líder Auditor":   [report.leader_auditor.get_full_name()],
                "Total Cláusulas": [report.total_clauses()],
            }
            pd.DataFrame(meta).to_excel(writer, index=False, sheet_name="Datos Generales")

        resp = HttpResponse(
            output.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        resp["Content-Disposition"] = f'attachment; filename="report_{report.id}.xlsx"'
        return resp

    except Report.DoesNotExist:
        return JsonResponse({"error": "Informe no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)