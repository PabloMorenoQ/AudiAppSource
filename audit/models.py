import json
from django.db import models
from accounts.models import Organization, User
from django.core.serializers.json import DjangoJSONEncoder

# Create your models here.
class CheckList(models.Model): # lista de verificacion 
    process = models.CharField(max_length=255)
    place = models.CharField(max_length=255)
    clauses_list = models.TextField()
    audit_data = models.JSONField(blank=True, null=True) # informacion de la lista 
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    dependency = models.CharField(max_length=255)
    leader_auditor = models.ForeignKey(User, on_delete=models.CASCADE) # nuevo
    process_type = models.CharField(max_length=255, blank=False, default="Ciclo de vida")

    def __str__(self):
        return f"{self.id} - {self.process} - {self.place}"
    
    def export(self): # nuevo
        return {
            "proceso": self.process,
            "lugar": self.place,
            "organization":self.organization.name,
            "auditor_lider": self.leader_auditor.first_name,
            "lista_clausulas": self.clauses_list,
            "auditoria": self.audit_data,
            "process_type": self.process_type
        }
        
class AuditPlan(models.Model):
    creation_date = models.DateField()
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    leader_auditor= models.ForeignKey(User, on_delete=models.CASCADE)
    clauses_list = models.TextField()
    plan_content    = models.JSONField(blank=True, null=True)
    
    def __str__(self):
        return f"Plan {self.id} - {self.organization.name}"
    
    def export(self):
        return {
            "creation_date":str(self.creation_date),
            "organization":self.organization.name,
            "leader_auditor":f"{self.leader_auditor.first_name} {self.leader_auditor.last_name}",
            "clauses_list":self.clauses_list,
            "plan_content":self.plan_content,
        }   

class Report(models.Model):
    creation_date = models.DateField()
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    leader_auditor = models.ForeignKey(User, on_delete=models.CASCADE)
    clauses_list = models.TextField()
    checklist = models.ManyToManyField(CheckList)

    # Campos para almacenar el contenido de las tablas como JSON en strings
    resumen_data = models.TextField(default='{}')  # Diccionario JSON como string
    fortalezas_data = models.TextField(default='[]')  # Lista JSON como string
    conformidades_data = models.TextField(default='[]')
    recomendaciones_data = models.TextField(default='[]')
    riesgos_data = models.TextField(default='[]')
    no_conformidades_data = models.TextField(default='[]')

    pertinencia_data = models.TextField(default='[]')
    adecuacion_data = models.TextField(default='[]')
    eficacia_data = models.TextField(default='[]')

    def __str__(self):
        return f"Report - {self.id} - {self.organization.name}"

    def total_clauses(self):
        return len(self.clauses_list.split(','))

    def export(self):
        return {
            "creation_date": self.creation_date,
            "organization": self.organization.name,
            "leader_auditor": self.leader_auditor.first_name,
            "total_clausulas": self.total_clauses(),
            "resumen": json.loads(self.resumen_data),
            "fortalezas": json.loads(self.fortalezas_data),
            "conformidades": json.loads(self.conformidades_data),
            "recomendaciones": json.loads(self.recomendaciones_data),
            "riesgos": json.loads(self.riesgos_data),
            "no_conformidades": json.loads(self.no_conformidades_data),
        }



    def import_data(self, data):
        self.fecha_creacion = data.get("fecha_creacion", self.fecha_creacion)
        self.organizacion = Organization.objects.get(nombre=data["organizacion"])
        self.auditor_lider = User.objects.get(nombre=data["auditor_lider"])