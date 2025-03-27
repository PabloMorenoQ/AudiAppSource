from django.db import models
from accounts.models import Organization, User

# Create your models here.
class CheckList(models.Model): # lista de verificacion 
    process = models.CharField(max_length=255)
    place = models.CharField(max_length=255)
    clauses_list = models.TextField()
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    dependency = models.CharField(max_length=255)
    leader_auditor = models.ForeignKey(User, on_delete=models.CASCADE) # nuevo

    def __str__(self):
        return f"{self.id} - {self.process} - {self.place}"
    
    def export(self): # nuevo
        return {
            "proceso": self.process,
            "lugar": self.place,
            "auditor_lider": self.leader_auditor.first_name,
            "lista_clausulas": self.clauses_list,
        }
    
class AuditPlan(models.Model):
    creation_date = models.DateField()
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    leader_auditor= models.ForeignKey(User, on_delete=models.CASCADE)
    clauses_list = models.TextField()
    
    def __str__(self):
        return f"Plan {self.id} - {self.organization.name}"
    
    def export(self): # nuevo
        return {
            "creation_date": self.creation_date,
            "organization": self.organization,
            "leader_auditor_": self.leader_auditor.first_name,
            "clauses_list": self.clauses_list,
        }    
    
class Report(models.Model):
    creation_date = models.DateField()
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    leader_auditor = models.ForeignKey(User, on_delete=models.CASCADE)
    clauses_list = models.TextField()
    checklist = models.ManyToManyField(CheckList)

    def __str__(self):
        return f"Report - {self.id} - {self.organization.name}"

    def total_clauses(self):
        return len(self.clauses_list.split(','))
    
    def export(self):
        return {
            "creation_date": self.creation_date,
            "organization": self.organization.name,
            "leader_auditor": self.auditor_lider.first_name,
            "total_clausulas": self.total_clauses(),
        }

    def import_data(self, data):
        self.fecha_creacion = data.get("fecha_creacion", self.fecha_creacion)
        self.organizacion = Organization.objects.get(nombre=data["organizacion"])
        self.auditor_lider = User.objects.get(nombre=data["auditor_lider"])