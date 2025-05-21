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
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.merge import CellRange
from openpyxl import Workbook


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
    if request.user.role not in ['auditLeaderUser', 'superUser', 'organizationUser']:
        return JsonResponse({"error": "No autorizado"}, status=403)
    # if not request.user.is_authenticated:
    #     messages.warning(request, _("Debes iniciar sesión para ver el dashboard."))
    #     return redirect('login')

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

        elif form_type == 'create_user':
            username = request.POST.get('username')
            email = request.POST.get('email')
            password = request.POST.get('password')
            role = request.POST.get('role')
            first_name = request.POST.get('first_name')
            last_name = request.POST.get('last_name')

        if User.objects.filter(username=username).exists():
            messages.error(request, f"El usuario {username} ya existe.")
        else:
            new_user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=role,
                organization_id=org
            )
            messages.success(request, f"Usuario {username} creado correctamente.")


        return redirect('admin_dashboard')

    context = {
        'users': User.objects.filter(organization=org),
        'audit_plans': AuditPlan.objects.filter(organization=org),
        'checklists': CheckList.objects.filter(organization=org).select_related("leader_auditor", "organization"),
        'reports': Report.objects.filter(organization=org),
        'groups': Group.objects.all(),
    }
    return render(request, 'dashboard.html', context)

# @csrf_exempt
def download_excel_checklist(request):
    if request.user.role not in ['auditLeaderUser', 'superUser', 'organizationUser']:
        return JsonResponse({"error": "No autorizado"}, status=403)

    checklist_id = request.GET.get("checklist_id")
    if not checklist_id:
        return JsonResponse({"error": "ID de checklist no proporcionado"}, status=400)

    try:
        checklist = CheckList.objects.get(id=checklist_id)
        audit_data = checklist.audit_data

        if isinstance(audit_data, str):
            audit_data = json.loads(audit_data)

        output = BytesIO()

        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            # Hoja 1: Auditoría
            df = pd.DataFrame(audit_data)
            df.to_excel(writer, index=False, sheet_name="Auditoría", startrow=1)
            ws = writer.sheets["Auditoría"]

            header_fill = PatternFill(start_color="999999", end_color="999999", fill_type="solid")
            white_font = Font(color="FFFFFF", bold=True)
            border = Border(
                left=Side(border_style="thin"),
                right=Side(border_style="thin"),
                top=Side(border_style="thin"),
                bottom=Side(border_style="thin")
            )

            for col_num, column_cells in enumerate(ws.iter_cols(min_row=2, max_row=2), 1):
                cell = column_cells[0]
                cell.fill = header_fill
                cell.font = white_font
                cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
                cell.border = border
                ws.column_dimensions[cell.column_letter].width = 30

            for row in ws.iter_rows(min_row=3, max_row=ws.max_row):
                for cell in row:
                    cell.alignment = Alignment(wrap_text=True, vertical="center")
                    cell.border = border
                ws.row_dimensions[row[0].row].height = 80

            # Hoja 2: Resumen
            meta_data = {
                "Proceso": [checklist.process],
                "Lugar": [checklist.place],
                "Organización": [checklist.organization.name],
                "Auditor Líder": [checklist.leader_auditor.first_name],
                "Tipo de Proceso": [checklist.process_type],
                "Cláusulas": [checklist.clauses_list]
            }
            meta_df = pd.DataFrame(meta_data)
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

    
# @csrf_exempt
def download_excel_audit_plan(request):
    # autorización
    if request.user.role not in ['auditLeaderUser', 'superUser', 'organizationUser']:
        return JsonResponse({"error": "No autorizado"}, status=403)

    plan_id = request.GET.get("plan_id")
    if not plan_id:
        return JsonResponse({"error": "ID de plan no proporcionado"}, status=400)

    try:
        plan = AuditPlan.objects.get(id=plan_id)
        content = plan.plan_content or {}
        if isinstance(content, str):
            content = json.loads(content)

        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            wb = writer.book
            # eliminar hoja por defecto
            if wb.sheetnames:
                wb.remove(wb[wb.sheetnames[0]])

            # estilos comunes
            thin = Side(border_style="thin", color="000000")
            border = Border(left=thin, right=thin, top=thin, bottom=thin)
            center = Alignment(horizontal="center", vertical="center", wrap_text=True)
            wrap = Alignment(wrap_text=True, vertical="top")
            header_fill = PatternFill("solid", fgColor="999999")
            section_fill = PatternFill("solid", fgColor="C0C0C0")
            white_bold = Font(color="FFFFFF", bold=True)
            black_bold = Font(color="000000", bold=True)

            def set_cols(ws, widths):
                for i, w in enumerate(widths, start=1):
                    ws.column_dimensions[get_column_letter(i)].width = w

            # === 1) Portada ===
            ws0 = wb.create_sheet("Portada")
            set_cols(ws0, [3, 40, 40])
            # Título principal combinado B2:D4
            ws0.merge_cells("B2:D4")
            c = ws0["B2"]
            c.value = plan.organization.name.upper()
            c.font = Font(size=20, bold=True)
            c.alignment = center

            # === 2) Alcance – Criterios – Objetivos ===
            ws1 = wb.create_sheet("Alcance - Criterios - Objetivos")
            set_cols(ws1, [3, 34, 58, 26])

            # 2.1 Participantes
            ws1.merge_cells("B2:B4")
            c = ws1["B2"]
            c.border = border
            c.value = plan.organization.name.upper()
            c.font = Font(size=20, bold=True)
            c.alignment = center
            c = ws1["B3"]
            c.border = border
            c = ws1["B4"]
            c.border = border

            ws1.merge_cells("C2:C4")
            c = ws1["C2"]
            c.value = "Name".upper()
            c.font = Font(size=20, bold=True)
            c.alignment = center
            c.border = border
            c = ws1["C3"]
            c.border = border
            c = ws1["C4"]
            c.border = border

            ws1.merge_cells("D2:D4")
            c = ws1["D2"]
            c.value = "Fechas".upper()
            c.font = Font(size=20, bold=True)
            c.alignment = center
            c.border = border
            c = ws1["D3"]
            c.border = border
            c = ws1["D4"]
            c.border = border

            ws1.merge_cells("B6:D6")
            c = ws1["B6"]
            c.value = "Participantes en la elaboración del Programa de Auditoría"
            c.fill = header_fill; c.font = white_bold; c.alignment = center; c.border = border

            headers = ["Rol", "Nombre", "Asistencia"]
            for j, txt in enumerate(headers, start=2):
                cell = ws1.cell(row=7, column=j, value=txt)
                cell.fill = section_fill; cell.font = black_bold; cell.alignment = center; cell.border = border

            for i, row_data in enumerate(content.get("tabla-revision", []), start=8):
                ws1.row_dimensions[i].height = 50
                for j, val in enumerate(row_data, start=2):
                    cell = ws1.cell(row=i, column=j, value=val)
                    cell.alignment = wrap; cell.border = border

            # espacio
            sep = ws1.max_row + 2

            # 2.2 Alcance
            ws1.merge_cells(start_row=sep, start_column=2, end_row=sep, end_column=4)
            c = ws1.cell(row=sep, column=2, value="Alcance del Programa de Auditoría")
            c.fill = header_fill; c.font = white_bold; c.alignment = center; c.border = border

            headers2 = ["Item", "Descripción", "Responsable"]
            for j, txt in enumerate(headers2, start=2):
                cell = ws1.cell(row=sep+1, column=j, value=txt)
                cell.fill = section_fill; cell.font = black_bold; cell.alignment = center; cell.border = border

            for k, row_data in enumerate(content.get("tabla-alcance", []), start=sep+2):
                ws1.row_dimensions[k].height = 40
                for j, val in enumerate(row_data, start=2):
                    cell = ws1.cell(row=k, column=j, value=val)
                    cell.alignment = wrap; cell.border = border

            # 2.3 Criterios
            sep2 = ws1.max_row + 2
            ws1.merge_cells(start_row=sep2, start_column=2, end_row=sep2, end_column=4)
            c = ws1.cell(row=sep2, column=2, value="Criterios del Programa de Auditoría")
            c.fill = header_fill; c.font = white_bold; c.alignment = center; c.border = border

            headers3 = ["Cláusula", "Descripción", "Fuente"]
            for j, txt in enumerate(headers3, start=2):
                cell = ws1.cell(row=sep2+1, column=j, value=txt)
                cell.fill = section_fill; cell.font = black_bold; cell.alignment = center; cell.border = border

            for k, row_data in enumerate(content.get("tabla-criterios", []), start=sep2+2):
                ws1.row_dimensions[k].height = 40
                for j, val in enumerate(row_data, start=2):
                    cell = ws1.cell(row=k, column=j, value=val)
                    cell.alignment = wrap; cell.border = border

            # === 3) Incertidumbre ===
            ws2 = wb.create_sheet("Uncertainty")
            set_cols(ws2, [3, 20, 50, 50, 27])

            # 3.1 Oportunidades
            ws2.merge_cells("B6:E6")
            c = ws2["B6"]
            c.value = "Determinación y Evaluación de Oportunidades"
            c.fill = header_fill; c.font = white_bold; c.alignment = center; c.border = border

            headers4 = ["Código", "Descripción", "Impacto", "Probabilidad"]
            for j, txt in enumerate(headers4, start=2):
                cell = ws2.cell(row=7, column=j, value=txt)
                cell.fill = section_fill; cell.font = black_bold; cell.alignment = center; cell.border = border

            for i, row_data in enumerate(content.get("tabla-oportunidades", []), start=8):
                ws2.row_dimensions[i].height = 40
                for j, val in enumerate(row_data, start=2):
                    cell = ws2.cell(row=i, column=j, value=val)
                    cell.alignment = wrap; cell.border = border

            # espacio y Riesgos
            sep3 = ws2.max_row + 2
            ws2.merge_cells(start_row=sep3, start_column=2, end_row=sep3, end_column=5)
            c = ws2.cell(row=sep3, column=2, value="Determinación y Evaluación de Riesgos")
            c.fill = header_fill; c.font = white_bold; c.alignment = center; c.border = border

            for j, txt in enumerate(headers4, start=2):
                cell = ws2.cell(row=sep3+1, column=j, value=txt)
                cell.fill = section_fill; cell.font = black_bold; cell.alignment = center; cell.border = border

            for k, row_data in enumerate(content.get("tabla-riesgos", []), start=sep3+2):
                ws2.row_dimensions[k].height = 40
                for j, val in enumerate(row_data, start=2):
                    cell = ws2.cell(row=k, column=j, value=val)
                    cell.alignment = wrap; cell.border = border

            # === 4) Recursos ===
            ws3 = wb.create_sheet("Resources")
            set_cols(ws3, [3, 35, 50, 30])

            ws3.merge_cells("B6:D6")
            c = ws3["B6"]
            c.value = "Recursos para la Gestión del Programa de Auditorías"
            c.fill = header_fill; c.font = white_bold; c.alignment = center; c.border = border

            headers5 = ["Recurso", "Descripción", "Cantidad"]
            for j, txt in enumerate(headers5, start=2):
                cell = ws3.cell(row=7, column=j, value=txt)
                cell.fill = section_fill; cell.font = black_bold; cell.alignment = center; cell.border = border

            for i, row_data in enumerate(content.get("tabla-recursos", []), start=8):
                ws3.row_dimensions[i].height = 40
                for j, val in enumerate(row_data, start=2):
                    cell = ws3.cell(row=i, column=j, value=val)
                    cell.alignment = wrap; cell.border = border

            # espacio y Equipo Auditor
            sep4 = ws3.max_row + 2
            ws3.merge_cells(start_row=sep4, start_column=2, end_row=sep4, end_column=4)
            c = ws3.cell(row=sep4, column=2, value="Equipo Auditor")
            c.fill = header_fill; c.font = white_bold; c.alignment = center; c.border = border

            headers6 = ["Nombre", "Rol", "Contacto"]
            for j, txt in enumerate(headers6, start=2):
                cell = ws3.cell(row=sep4+1, column=j, value=txt)
                cell.fill = section_fill; cell.font = black_bold; cell.alignment = center; cell.border = border

            for k, row_data in enumerate(content.get("tabla-equipoAuditor", []), start=sep4+2):
                ws3.row_dimensions[k].height = 40
                for j, val in enumerate(row_data, start=2):
                    cell = ws3.cell(row=k, column=j, value=val)
                    cell.alignment = wrap; cell.border = border

            # === 5) Implementación ===
            ws4 = wb.create_sheet("Implementation")
            set_cols(ws4, [3, 20, 20, 50, 20, 20])

            ws4.merge_cells("B6:F6")
            c = ws4["B6"]
            c.value = "Implementación del Programa de Auditoría"
            c.fill = header_fill; c.font = white_bold; c.alignment = center; c.border = border

            headers7 = ["Etapa", "Descripción", "Responsable"]
            for j, txt in enumerate(headers7, start=2):
                cell = ws4.cell(row=7, column=j, value=txt)
                cell.fill = section_fill; cell.font = black_bold; cell.alignment = center; cell.border = border

            for i, row_data in enumerate(content.get("tabla-estapasAud", []), start=8):
                ws4.row_dimensions[i].height = 40
                for j, val in enumerate(row_data, start=2):
                    cell = ws4.cell(row=i, column=j, value=val)
                    cell.alignment = wrap; cell.border = border

            # espacio y Metodología
            sep5 = ws4.max_row + 2
            ws4.merge_cells(start_row=sep5, start_column=2, end_row=sep5, end_column=6)
            c = ws4.cell(row=sep5, column=2, value="Metodología de Auditoría")
            c.fill = header_fill; c.font = white_bold; c.alignment = center; c.border = border

            headers8 = ["Método", "Descripción", "Herramientas"]
            for j, txt in enumerate(headers8, start=2):
                cell = ws4.cell(row=sep5+1, column=j, value=txt)
                cell.fill = section_fill; cell.font = black_bold; cell.alignment = center; cell.border = border

            for k, row_data in enumerate(content.get("tabla-metodologia", []), start=sep5+2):
                ws4.row_dimensions[k].height = 40
                for j, val in enumerate(row_data, start=2):
                    cell = ws4.cell(row=k, column=j, value=val)
                    cell.alignment = wrap; cell.border = border

            # === 6) Plan de Auditoría ===
            ws5 = wb.create_sheet("Audit Plan")
            set_cols(ws5, [3,20,20,20,20,20,40,15,15,30,50])

            # Objetivos
            ws5.merge_cells("B6:L6")
            c = ws5["B6"]
            c.value = "Objetivos de Auditoría"
            c.fill = header_fill; c.font = white_bold; c.alignment = center; c.border = border

            objs = content.get("tabla-objetivos", [])
            text = "\n".join(f"{i+1}. {o[1]}" for i,o in enumerate(objs))
            ws5.row_dimensions[7].height = 70
            cell = ws5.cell(row=7, column=2, value=text)
            cell.alignment = wrap; cell.border = border
            ws5.merge_cells("B7:L7")

            # Scope dentro de Plan
            sep6 = 8
            ws5.merge_cells(start_row=sep6, start_column=2, end_row=sep6, end_column=12)
            c = ws5.cell(row=sep6, column=2, value="Alcance")
            c.fill = header_fill; c.font = white_bold; c.alignment = center; c.border = border

            # subtítulos y datos tabla-alcance
            for j, txt in enumerate(["Ítem","Descripción","Responsable"], start=2):
                cell = ws5.cell(row=sep6+1, column=j, value=txt)
                cell.fill = section_fill; cell.font = black_bold; cell.alignment = center; cell.border = border
            for k, row_data in enumerate(content.get("tabla-alcance", []), start=sep6+2):
                ws5.row_dimensions[k].height = 40
                for j, val in enumerate(row_data, start=2):
                    cell = ws5.cell(row=k, column=j, value=val)
                    cell.alignment = wrap; cell.border = border

            # Observaciones (última columna) para cada fila de planAud
            sep7 = ws5.max_row + 2
            ws5.merge_cells(start_row=sep7, start_column=2, end_row=sep7, end_column=12)
            c = ws5.cell(row=sep7, column=2, value="Plan de Auditoría Detallado")
            c.fill = header_fill; c.font = white_bold; c.alignment = center; c.border = border

            headers9 = ["#", "Proceso", "Dependencia", "Lugar", "Método", "Cláusulas", "Fecha", "Hora", "Responsable", "Auditor", "Observaciones"]
            for j, txt in enumerate(headers9, start=1):
                cell = ws5.cell(row=sep7+1, column=j, value=txt)
                cell.fill = section_fill; cell.font = black_bold; cell.alignment = center; cell.border = border

            for i, row_data in enumerate(content.get("tabla-planAud", []), start=sep7+2):
                ws5.row_dimensions[i].height = 40
                for j, val in enumerate(row_data, start=1):
                    cell = ws5.cell(row=i, column=j, value=val)
                    cell.alignment = wrap; cell.border = border

            # # === Resumen ===
            # meta = {
            #     "ID": [plan.id],
            #     "Fecha": [plan.creation_date.strftime('%Y-%m-%d')],
            #     "Organización": [plan.organization.name],
            #     "Líder Auditor": [plan.leader_auditor.get_full_name()],
            #     "Cláusulas": [plan.clauses_list],
            # }
            # pd.DataFrame(meta).to_excel(writer, index=False, sheet_name="Resumen")

        response = HttpResponse(
            output.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = f'attachment; filename=audit_plan_{plan.id}.xlsx'
        return response

    except AuditPlan.DoesNotExist:
        return JsonResponse({"error": "Plan no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def download_excel_report(request):
    
    if request.user.role not in ['auditLeaderUser', 'superUser', 'organizationUser']:
        return JsonResponse({"error": "No autorizado"}, status=403)

    report_id = request.GET.get("report_id")
    if not report_id:
        return JsonResponse({"error": "ID de report no proporcionado"}, status=400)

    from openpyxl.utils import get_column_letter
    from openpyxl.chart import ScatterChart, Reference, Series
    
    try:
        report = Report.objects.get(id=report_id)

        resumen_raw = json.loads(report.resumen_data or "[]")
        resumen_headers = ["Ciclo de vida", "Proceso", "Fortalezas", "Recomendaciones", "Riesgos", "No Conformidades", "Total"]
        resumen = [dict(zip(resumen_headers, row)) for row in resumen_raw]

        detail_cols = ["No.", "TIPO", "DESCRIPCIÓN", "Requisito",
                       "PROCESO/LUGAR", "ORIGEN", "TEMA", "Referencia", "Responsable"]

        sheets_data = {}
        for name, data_str in [
            ("Fortalezas", report.fortalezas_data),
            ("Conformidades", report.conformidades_data),
            ("Recomendaciones", report.recomendaciones_data),
            ("Riesgos", report.riesgos_data),
            ("NoConformidades", report.no_conformidades_data),
        ]:
            data = json.loads(data_str or "[]")
            formatted = [dict(zip(detail_cols, row)) for row in data]
            sheets_data[name] = formatted

        # Estilos
        thin = Side(border_style="thin", color="000000")
        border = Border(left=thin, right=thin, top=thin, bottom=thin)
        center = Alignment(horizontal="center", vertical="center", wrap_text=True)
        wrap_top = Alignment(wrap_text=True, vertical="top")
        header_fill = PatternFill("solid", fgColor="999999")
        section_fill = PatternFill("solid", fgColor="C0C0C0")
        white_bold = Font(color="FFFFFF", bold=True)
        black_bold = Font(color="000000", bold=True)

        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            wb = writer.book

            # 1) HOJA RESUMEN
            ws = wb.create_sheet("Resumen")
            for i in range(1, 8):
                ws.column_dimensions[get_column_letter(i)].width = 25

            row = 1
            criterios = [
                ("Pertinencia", report.pertinencia_data),
                ("Adecuación", report.adecuacion_data),
                ("Eficacia", report.eficacia_data),
            ]
            for titulo, contenido in criterios:
                ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=7)
                c = ws.cell(row=row, column=1, value=titulo)
                c.fill = header_fill
                c.font = white_bold
                c.alignment = center
                c.border = border
                ws.row_dimensions[row].height = 25
                row += 1

                ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=7)
                c = ws.cell(row=row, column=1, value=contenido)
                c.alignment = wrap_top
                c.border = border
                ws.row_dimensions[row].height = 75
                row += 2

            # Tabla resumen general
            headers = ["Ciclo de vida", "Proceso", "Fortalezas", "Recomendaciones", "Riesgos", "No Conformidades", "Total"]
            row += 1
            for j, txt in enumerate(headers, start=1):
                c = ws.cell(row=row, column=j, value=txt)
                c.fill = section_fill
                c.font = black_bold
                c.alignment = center
                c.border = border

            resumen_data = json.loads(report.resumen_data or "[]")
            data_start_row = row + 1
            for resumen_row in resumen_data:
                row += 1
                for j, val in enumerate(resumen_row[:6], start=1):  # columnas A-F
                    if j >= 3:  # columnas numéricas
                        try:
                            val = float(val)
                        except:
                            pass
                    c = ws.cell(row=row, column=j, value=val)
                    c.alignment = wrap_top
                    c.border = border

                # Columna G (Total) con fórmula
                total_formula = f"=SUM(C{row}:F{row})"
                c = ws.cell(row=row, column=7, value=total_formula)
                c.alignment = center
                c.border = border

            data_end_row = row

            # Gráfico de puntos
            chart = ScatterChart()
            chart.title = "Resumen por Ciclo de Vida"
            chart.x_axis.title = "Ciclo de Vida"
            chart.y_axis.title = "Total"
            chart.style = 13

            x_values = Reference(ws, min_col=1, min_row=data_start_row, max_row=data_end_row)
            y_values = Reference(ws, min_col=7, min_row=data_start_row, max_row=data_end_row)
            series = Series(y_values, x_values, title="Total por Ciclo de Vida")
            chart.series.append(series)
            ws.add_chart(chart, "I5")

            # 2) HOJAS DE DETALLE
            for name, data in sheets_data.items():
                ws2 = wb.create_sheet(name)
                for i in range(1, 10):
                    ws2.column_dimensions[get_column_letter(i)].width = 20

                ws2.merge_cells("A1:I1")
                c = ws2["A1"]
                c.value = name.upper()
                c.fill = header_fill
                c.font = white_bold
                c.alignment = center
                c.border = border
                ws2.row_dimensions[1].height = 30

                ws2.row_dimensions[2].height = 5
                for j, h in enumerate(detail_cols, start=1):
                    c = ws2.cell(row=3, column=j, value=h)
                    c.fill = section_fill
                    c.font = black_bold
                    c.alignment = center
                    c.border = border

                for i, record in enumerate(data, start=4):
                    ws2.row_dimensions[i].height = 25
                    for j, key in enumerate(detail_cols, start=1):
                        val = record.get(key, "")
                        c = ws2.cell(row=i, column=j, value=val)
                        c.alignment = wrap_top
                        c.border = border

            # 3) HOJA DATOS GENERALES
            meta = {
                "ID Informe":      report.id,
                "Fecha":           report.creation_date.strftime('%Y-%m-%d'),
                "Organización":    report.organization.name,
                "Líder Auditor":   report.leader_auditor.get_full_name(),
                "Total Cláusulas": report.total_clauses(),
            }
            dfm = pd.DataFrame([meta])
            dfm.to_excel(writer, sheet_name="Datos Generales", index=False, startrow=0)
            ws3 = writer.sheets["Datos Generales"]
            for i, key in enumerate(meta.keys(), start=1):
                ws3.column_dimensions[get_column_letter(i)].width = 25
                cell = ws3.cell(row=1, column=i, value=key)
                cell.fill = section_fill
                cell.font = black_bold
                cell.alignment = center
                cell.border = border
                cell = ws3.cell(row=2, column=i, value=meta[key])
                cell.alignment = wrap_top
                cell.border = border
            ws3.row_dimensions[1].height = 25
            ws3.row_dimensions[2].height = 25

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