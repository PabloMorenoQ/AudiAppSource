import json
from django.db import models
from accounts.models import Organization, User
from django.core.serializers.json import DjangoJSONEncoder

# ========================================
# MODELO 1: AuditPlan (debe ir primero)
# ========================================
class AuditPlan(models.Model):
    creation_date = models.DateField()
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    leader_auditor = models.ForeignKey(User, on_delete=models.CASCADE)
    clauses_list = models.TextField()
    plan_content = models.JSONField(blank=True, null=True)
    
    def __str__(self):
        return f"Plan {self.id} - {self.organization.name} ({self.creation_date})"
    
    def export(self):
        return {
            "id": self.id,
            "creation_date": str(self.creation_date),
            "organization": self.organization.name,
            "leader_auditor": f"{self.leader_auditor.first_name} {self.leader_auditor.last_name}",
            "clauses_list": self.clauses_list,
            "plan_content": self.plan_content,
        }
    
    # ✅ Método helper para obtener todos los checklists de este plan
    def get_checklists(self):
        """Retorna todos los checklists asociados a este plan"""
        return self.checklists.all()
    
    # ✅ Método helper para verificar si el plan tiene checklists
    def has_checklists(self):
        """Retorna True si el plan tiene al menos un checklist"""
        return self.checklists.exists()
    
    # ✅ Método helper para contar checklists
    def checklist_count(self):
        """Retorna el número de checklists asociados"""
        return self.checklists.count()


# ========================================
# MODELO 2: CheckList (con vínculo a Plan)
# ========================================
class CheckList(models.Model):
    # ✅ NUEVO: Relación con AuditPlan
    audit_plan = models.ForeignKey(
        AuditPlan, 
        on_delete=models.CASCADE,
        related_name='checklists',  # Permite hacer: plan.checklists.all()
        null=True,  # Temporal para migración
        blank=True,
        help_text="Plan de auditoría al que pertenece este checklist"
    )
    
    # Campos existentes
    process = models.CharField(max_length=255)
    place = models.CharField(max_length=255)
    clauses_list = models.TextField()
    audit_data = models.JSONField(blank=True, null=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    dependency = models.CharField(max_length=255)
    leader_auditor = models.ForeignKey(User, on_delete=models.CASCADE)
    process_type = models.CharField(max_length=255, blank=False, default="Ciclo de vida")
    
    # ✅ NUEVO: Campos de auditoría (opcional pero útil)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        ordering = ['-id']  # Más recientes primero
        verbose_name = "Lista de Verificación"
        verbose_name_plural = "Listas de Verificación"

    def __str__(self):
        plan_info = f"Plan {self.audit_plan.id}" if self.audit_plan else "Sin Plan"
        return f"{self.id} - {self.process} - {self.place} ({plan_info})"
    
    def export(self):
        return {
            "id": self.id,
            "proceso": self.process,
            "lugar": self.place,
            "organization": self.organization.name,
            "auditor_lider": f"{self.leader_auditor.first_name} {self.leader_auditor.last_name}",
            "lista_clausulas": self.clauses_list,
            "auditoria": self.audit_data,
            "process_type": self.process_type,
            # ✅ NUEVO: Incluir información del plan
            "audit_plan_id": self.audit_plan.id if self.audit_plan else None,
            "audit_plan_date": str(self.audit_plan.creation_date) if self.audit_plan else None,
        }
    
    # ✅ Método helper para validar que pertenece al plan correcto
    def belongs_to_plan(self, plan_id):
        """Verifica si este checklist pertenece al plan especificado"""
        return self.audit_plan_id == plan_id
    
    # ✅ Método para obtener el nombre del plan
    def get_plan_name(self):
        """Retorna el nombre/identificador del plan"""
        if self.audit_plan:
            return f"Plan {self.audit_plan.id} - {self.audit_plan.creation_date}"
        return "Sin plan asignado"


# ========================================
# MODELO 3: Report (sin cambios necesarios)
# ========================================
class Report(models.Model):
    creation_date = models.DateField()
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    leader_auditor = models.ForeignKey(User, on_delete=models.CASCADE)
    clauses_list = models.TextField()
    
    # ✅ Esta relación ManyToMany ya permite vincular múltiples checklists
    # Los checklists ya tienen el vínculo con AuditPlan, así que indirectamente
    # también tienes acceso al plan desde el reporte
    checklist = models.ManyToManyField(CheckList, related_name='reports')

    # Campos existentes
    resumen_data = models.TextField(default='{}')
    fortalezas_data = models.TextField(default='[]')
    conformidades_data = models.TextField(default='[]')
    recomendaciones_data = models.TextField(default='[]')
    riesgos_data = models.TextField(default='[]')
    no_conformidades_data = models.TextField(default='[]')
    pertinencia_data = models.TextField(default='[]')
    adecuacion_data = models.TextField(default='[]')
    eficacia_data = models.TextField(default='[]')

    class Meta:
        ordering = ['-creation_date']
        verbose_name = "Reporte de Auditoría"
        verbose_name_plural = "Reportes de Auditoría"

    def __str__(self):
        return f"Report - {self.id} - {self.organization.name} ({self.creation_date})"

    def total_clauses(self):
        return len(self.clauses_list.split(','))

    def export(self):
        return {
            "id": self.id,
            "creation_date": str(self.creation_date),
            "organization": self.organization.name,
            "leader_auditor": f"{self.leader_auditor.first_name} {self.leader_auditor.last_name}",
            "total_clausulas": self.total_clauses(),
            "resumen": json.loads(self.resumen_data),
            "fortalezas": json.loads(self.fortalezas_data),
            "conformidades": json.loads(self.conformidades_data),
            "recomendaciones": json.loads(self.recomendaciones_data),
            "riesgos": json.loads(self.riesgos_data),
            "no_conformidades": json.loads(self.no_conformidades_data),
            # ✅ NUEVO: Información de checklists vinculados
            "checklists_count": self.checklist.count(),
            "checklists": [
                {
                    "id": cl.id,
                    "proceso": cl.process,
                    "lugar": cl.place,
                    "plan_id": cl.audit_plan.id if cl.audit_plan else None
                }
                for cl in self.checklist.all()
            ]
        }
    
    # ✅ NUEVO: Método para obtener todos los planes vinculados
    def get_audit_plans(self):
        """Retorna los planes de auditoría relacionados a través de los checklists"""
        return AuditPlan.objects.filter(
            checklists__in=self.checklist.all()
        ).distinct()
    
    # ✅ NUEVO: Método para verificar consistencia de planes
    def is_single_plan_report(self):
        """Verifica si todos los checklists pertenecen al mismo plan"""
        plans = self.get_audit_plans()
        return plans.count() == 1
    
    def import_data(self, data):
        self.fecha_creacion = data.get("fecha_creacion", self.fecha_creacion)
        self.organizacion = Organization.objects.get(nombre=data["organizacion"])
        self.auditor_lider = User.objects.get(nombre=data["auditor_lider"])