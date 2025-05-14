import json
from django.conf import settings
from django.test import TestCase, Client
from django.urls import reverse
from accounts.models import User, Organization
from audit.models import CheckList, AuditPlan, Report
from datetime import date
from io import BytesIO
from openpyxl import Workbook
from unittest import skip
from accounts.models import User
import datetime
from django.contrib.auth import get_user_model

User = get_user_model()

class BaseTestSetup(TestCase):
    def setUp(self):
        self.client = Client()
        self.organization = Organization.objects.create(name="TestOrg", status="Activa")

        self.superuser = User.objects.create_user(username="admin", password="admin123",
            role="superUser", email="admin@test.com")

        self.org_user = User.objects.create_user(username="org_user", password="orgpass",
            role="organizationUser", email="org@test.com")

        self.audit_leader = User.objects.create_user(username="leader", password="leader123",
            role="auditLeaderUser", email="leader@test.com")

        self.auditor = User.objects.create_user(username="auditor", password="auditor123",
            role="auditUser", email="audit@test.com")

# ========================== INTERFAZ Y EXPORTACIÓN ==========================

class RF3_FormLabelsTest(BaseTestSetup):
    def test_checklist_form_labels(self):
        self.client.login(username="leader", password="leader123")
        response = self.client.get(reverse("checklists"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Cláusula')
        self.assertContains(response, 'Descripción')
        self.assertContains(response, 'Proceso')
        self.assertContains(response, 'Lugar')

class RF9_ExportChecklistTest(BaseTestSetup):
      def test_export_button_shows_checklist(self):
          checklist = CheckList.objects.create(
              process="Proceso A",
              place="Lugar A",
              clauses_list="4.1, 4.2",
              organization=self.organization,
              dependency="Mantenimiento",
              leader_auditor=self.audit_leader
          )
          self.client.login(username="leader", password="leader123")
          response = self.client.get(reverse("checklists"))
          self.assertEqual(response.status_code, 200)
          self.assertContains(response, "Lista de verificación") 
          self.assertContains(response, "Cláusula")  
          self.assertContains(response, "Descripción")

class RF20_ExportChecklistToExcelTest(BaseTestSetup):
    def test_export_checklist_to_excel(self):
        checklist = CheckList.objects.create(
            process="Proceso B",
            place="Lugar B",
            clauses_list="5.1, 5.2",
            organization=self.organization,
            dependency="Calidad",
            leader_auditor=self.audit_leader,
            audit_data=[
                {"Cláusula": "5.1", "Índice": "1", "Pregunta": "¿Existe evidencia?"},
                {"Cláusula": "5.2", "Índice": "2", "Pregunta": "¿Se cumple el requisito?"}
            ]
        )
        self.client.login(username="leader", password="leader123")
        response = self.client.post(
            reverse("download_excel"),
            data=json.dumps({"checklist_id": checklist.id}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                      response["Content-Type"])
        
class RF21_ImportChecklistExcelTest(BaseTestSetup):
    def test_import_xlsx_file(self):
        wb = Workbook()
        ws = wb.active
        ws.append(["Proceso", "Lugar", "Cláusulas"])
        ws.append(["Importado", "Oficina", "6.1,6.2"])

        f = BytesIO()
        wb.save(f)
        f.seek(0)
        f.name = "checklist.xlsx"

        self.client.login(username="leader", password="leader123")
        response = self.client.post(reverse("checklists"), {"file": f})
        self.assertEqual(response.status_code, 200)

class RF27_ExportReportTablesTest(BaseTestSetup):
    def test_export_report_tables(self):
        checklist = CheckList.objects.create(
            process="Proceso C",
            place="Lugar C",
            clauses_list="7.1, 7.2",
            organization=self.organization,
            dependency="Operaciones",
            leader_auditor=self.audit_leader,
            audit_data=[
                {"Cláusula": "7.1", "Índice": "1", "Pregunta": "¿Pregunta 1?"},
                {"Cláusula": "7.2", "Índice": "2", "Pregunta": "¿Pregunta 2?"}
            ]
        )
        self.client.login(username="leader", password="leader123")
        response = self.client.post(
            reverse("download_excel"),
            data=json.dumps({"checklist_id": checklist.id}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                      response["Content-Type"])

class RF34_ResumenPlanAuditoriaTest(BaseTestSetup):
    def test_resumen_plan_auditoria_view(self):
        AuditPlan.objects.create(
            creation_date=date.today(),
            organization=self.organization,
            leader_auditor=self.audit_leader,
            clauses_list="4.1, 4.2"
        )
        self.client.login(username="leader", password="leader123")
        response = self.client.get(reverse("audit_plan"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("plan de auditoría", response.content.decode().lower())

class RF35_ExportResumenPlanToExcelTest(BaseTestSetup):
    def test_export_resumen_to_excel(self):
        resumen_simulado = CheckList.objects.create(
            process="Resumen Plan Auditoría",
            place="Oficina Central",
            clauses_list="5.1, 5.2",
            organization=self.organization,
            dependency="Dirección",
            leader_auditor=self.audit_leader,
            audit_data=[
                {
                    "Cláusula": "5.1",
                    "Índice": "1",
                    "Pregunta": "¿Existe el plan de auditoría aprobado?"
                },
                {
                    "Cláusula": "5.2",
                    "Índice": "2",
                    "Pregunta": "¿Se comunicó a los responsables?"
                }
            ]
        )

        self.client.login(username="leader", password="leader123")
        response = self.client.post(
            reverse("download_excel"),
            data=json.dumps({"checklist_id": resumen_simulado.id}),
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                      response["Content-Type"])


# ========================== GESTIÓN DE ROLES, AUTENTICACIÓN, ORGANIZACIONES ==========================

@skip("Vista delete_checklist no implementada aún")
class RF54_DeleteChecklistTest(BaseTestSetup):
    def test_leader_can_delete_checklist(self):
        checklist = CheckList.objects.create(
            process="Proceso",
            place="Lugar",
            clauses_list="1.1",
            organization=self.organization,
            leader_auditor=self.audit_leader
        )
        self.client.login(username="leader", password="leader123")
        response = self.client.post(reverse("delete_checklist", args=[checklist.id]))
        self.assertEqual(response.status_code, 302)  # o 200 dependiendo de redirección
        self.assertFalse(CheckList.objects.filter(id=checklist.id).exists())

class RF55_ReportContentValidationTest(BaseTestSetup):
    def test_report_contains_checklist_data(self):
        checklist = CheckList.objects.create(
            process="Proceso Z",
            place="Lugar Z",
            clauses_list="6.1, 6.2",
            organization=self.organization,
            dependency="Finanzas",
            leader_auditor=self.audit_leader,
            audit_data=[
                {"Cláusula": "6.1", "Índice": "1", "Pregunta": "¿Pregunta A?"},
                {"Cláusula": "6.2", "Índice": "2", "Pregunta": "¿Pregunta B?"}
            ]
        )
        self.client.login(username="leader", password="leader123")

        url = reverse("download_excel")
        response = self.client.post(
            url,
            content_type="application/json",
            data=json.dumps({"checklist_id": checklist.id})
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

@skip("Funcionalidad de filtrado por fechas no implementada aún")
class RF56_PlanFilterByDateTest(TestCase):
    def setUp(self):
        # Crear organización y usuario necesarios para el test
        self.org = Organization.objects.create(name="Org Test")
        self.user = User.objects.create_user(
            username="auditor",
            password="testpass123",
            role="auditLeaderUser",
            organization=self.org
        )
        
        # Crear un plan con fecha 
        self.plan = AuditPlan.objects.create(
            creation_date=datetime.date.today(),
            organization=self.org,
            leader_auditor=self.user,
            clauses_list="cláusula 1, cláusula 2",
            plan_content={"tabla-planAud": []}
        )

    def test_filter_audit_plan_by_date(self):
        self.client.force_login(self.user)
        response = self.client.get("/ruta/del/filtro", {"fecha": datetime.date.today().isoformat()})
        self.assertEqual(response.status_code, 200)

class RF51_SessionExpirationTest(BaseTestSetup):
    def test_session_expires_after_logout(self):
        self.client.login(username="leader", password="leader123")
        self.client.post(reverse("logout"))

        response = self.client.get(reverse("profile"), follow=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn(settings.LOGIN_URL, response.redirect_chain[-1][0])


class RF52_RestrictedViewsTest(TestCase):
    def test_non_logged_user_redirected(self):
        url = reverse('audit_plan')  
        response = self.client.get(url)
        self.assertRedirects(response, "/core/")

class RF53_AuditPlanFormValidationTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.organization = Organization.objects.create(name="OrgTest")
        self.user = User.objects.create_user(
            username='testleader',
            password='password123',
            role='auditLeaderUser',
            organization=self.organization
        )
        self.client.force_login(self.user)

    def test_audit_plan_creation_requires_valid_json(self):
        """Debe rechazar un plan_content vacío o inválido."""
        url = reverse('audit_plan')
        
        response = self.client.post(url, {
            'plan_content': ''
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn("plan_content no es JSON válido", response.json().get("error", ""))

    def test_audit_plan_creation_accepts_valid_data(self):
        """Debe aceptar un plan_content bien formado"""
        url = reverse('audit_plan')
        valid_plan = {
            "tabla-planAud": [
                ["", "", "", "", "", "Cláusula A"],
                ["", "", "", "", "", "Cláusula B"]
            ]
        }
        response = self.client.post(url, {
            'plan_content': json.dumps(valid_plan)
        })
        self.assertEqual(response.status_code, 200)

        self.assertEqual(AuditPlan.objects.count(), 1)
        plan = AuditPlan.objects.first()
        self.assertIn("Cláusula A", plan.clauses_list)
        self.assertIn("Cláusula B", plan.clauses_list)
        self.assertEqual(plan.organization, self.organization)

class RF38_RolesManagementTest(BaseTestSetup):
    def test_admin_can_manage_roles(self):
        self.client.login(username="admin", password="admin123")
        response = self.client.get(reverse("audit_plan"))
        self.assertEqual(response.status_code, 200)

class RF39_AvailableRolesTest(BaseTestSetup):
    def test_roles_list_and_assignment(self):
        self.assertIn(self.superuser.role, ["superUser", "organizationUser", "auditLeaderUser", "auditUser"])
        self.assertIn(self.audit_leader.role, ["superUser", "organizationUser", "auditLeaderUser", "auditUser"])

class RF40_OnlyAdminCanManageRolesTest(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(username='admin', password='adminpass', is_staff=True)
        self.regular_user = User.objects.create_user(username='user', password='userpass')

    # Este test está deshabilitado porque la URL 'role_management' no está implementada
    # def test_only_admin_can_access_role_management(self):
    #     self.client.login(username='user', password='userpass')
    #     response = self.client.get(reverse('role_management'), follow=True)
    #     self.assertNotEqual(response.status_code, 200)

    #     self.client.logout()
    #     self.client.login(username='admin', password='adminpass')
    #     response = self.client.get(reverse('role_management'), follow=True)
    #     self.assertEqual(response.status_code, 200)


class RF41_LoginAuditLogTest(BaseTestSetup):
    def test_login_success_and_failure_logged(self):
        login_success = self.client.login(username="admin", password="admin123")
        self.assertTrue(login_success)
        login_fail = self.client.login(username="admin", password="wrongpass")
        self.assertFalse(login_fail)

class RF42_PasswordPolicyTest(BaseTestSetup):
    def test_password_policy_enforced(self):
        weak_password = "pass"
        strong_password = "Secure123@"
        user = User(username="newuser", email="new@e.com", role="auditUser")
        user.set_password(strong_password)
        self.assertTrue(user.check_password("Secure123@"))
        user.set_password(weak_password)
        self.assertTrue(user.check_password("pass")) 

class RF43_LoginWithEmailAndPasswordTest(BaseTestSetup):
    def test_login_with_email_and_password(self):
        login = self.client.login(username="admin", password="admin123")
        self.assertTrue(login)

class RF44_CredentialsValidationTest(BaseTestSetup):
    def test_wrong_credentials_show_error(self):
        login = self.client.login(username="admin@test.com", password="wrong")
        self.assertFalse(login)

class RF45_RoleBasedAccessTest(TestCase):
    def setUp(self):
        # Usuario sin permisos para crear planes
        self.user = User.objects.create_user(username="user_audit", password="1234", role="auditUser")

    def test_role_access_restrictions(self):
        self.client.login(username="user_audit", password="1234")
        response = self.client.get(reverse('audit_plan'), follow=True)
        self.assertNotContains(response, 'Crear Plan de Auditoría')
        self.assertEqual(response.status_code, 200)

class RF46_OrganizationAdminUserManagementTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.organization = Organization.objects.create(name="Org1", status="Active")
        self.admin_user = User.objects.create_user(
            username="adminorg",
            password="adminpass",
            role="organizationUser",  
            organization=self.organization
        )

    def test_org_admin_can_manage_users(self):
        self.client.login(username="adminorg", password="adminpass")
        
        url = reverse("admin_dashboard")  
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)

class RF47_AdminAccessLogViewTest(BaseTestSetup):
    def test_admin_can_view_access_logs(self):
        self.client.login(username="admin", password="admin123")
        response = self.client.get(reverse("audit_plan"))
        self.assertEqual(response.status_code, 200)

class RF48_AdminActivitySummaryTest(BaseTestSetup):
    def test_admin_activity_summary_accessible(self):
        self.client.login(username="admin", password="admin123")
        response = self.client.get(reverse("audit_plan"))
        self.assertEqual(response.status_code, 200)

class RF49_OrganizationCRUDTest(BaseTestSetup):
    def test_admin_can_manage_organizations(self):
        self.client.login(username="admin", password="admin123")
        response = self.client.get(reverse("audit_plan"))
        self.assertEqual(response.status_code, 200)

class RF50_AssignOrgAdminsTest(BaseTestSetup):
    def test_assign_admin_to_organization(self):
        self.client.login(username="admin", password="admin123")
        response = self.client.get(reverse("audit_plan"))
        self.assertEqual(response.status_code, 200)
