from django.db import models

# Create your models here.

class Organizacion(models.Model):
    nombre = models.CharField(max_length=255)
    estado = models.CharField(max_length=255)

    def __str__(self):
        return self.nombre

class Usuario(models.Model):
    nombre = models.CharField(max_length=255)
    correo = models.EmailField(unique=True)
    contrasena = models.CharField(max_length=255)
    organizacion = models.ForeignKey(Organizacion, on_delete=models.CASCADE) # Llama la organizacion a la cual pertenece el usuario
    es_admin = models.BooleanField(default=False)
    es_auditor_lider = models.BooleanField(default=False)

    def __str__(self):
        return self.nombre
    
class ListaVerificacion(models.Model):
    proceso = models.CharField(max_length=255)
    lugar = models.CharField(max_length=255)
    lista_clausulas = models.TextField()
    organizacion = models.ForeignKey(Organizacion, on_delete=models.CASCADE)
    dependencia = models.CharField(max_length=255)
    auditor_lider = models.ForeignKey(Usuario, on_delete=models.CASCADE) # nuevo

    def __str__(self):
        return f"{self.proceso} - {self.lugar}"
    
    def export(self): # nuevo
        return {
            "proceso": self.proceso,
            "lugar": self.lugar,
            "auditor_lider": self.auditor_lider.nombre,
            "lista_clausulas": self.lista_clausulas,
        }
    
class PlanAuditoria(models.Model):
    fecha_creacion = models.DateField()
    organizacion = models.ForeignKey(Organizacion, on_delete=models.CASCADE)
    auditor_lider = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    lista_clausulas = models.TextField()
    
    def __str__(self):
        return f"Plan {self.id} - {self.organizacion.nombre}"
    
    def export(self): # nuevo
        return {
            "fecha_creacion": self.fecha_creacion,
            "organizacion": self.organizacion,
            "auditor_lider": self.auditor_lider.nombre,
            "lista_clausulas": self.lista_clausulas,
        }

class Informe(models.Model):
    fecha_creacion = models.DateField()
    organizacion = models.ForeignKey(Organizacion, on_delete=models.CASCADE)
    auditor_lider = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    lista_clausulas = models.TextField()
    lista_verificacion = models.ManyToManyField(ListaVerificacion)

    def __str__(self):
        return f"Informe {self.id} - {self.organizacion.nombre}"

    def total_clauses(self):
        return len(self.lista_clausulas.split(','))
    
    def export(self):
        return {
            "fecha_creacion": self.fecha_creacion,
            "organizacion": self.organizacion.nombre,
            "auditor_lider": self.auditor_lider.nombre,
            "total_clausulas": self.total_clauses(),
        }

    def import_data(self, data):
        self.fecha_creacion = data.get("fecha_creacion", self.fecha_creacion)
        self.organizacion = Organizacion.objects.get(nombre=data["organizacion"])
        self.auditor_lider = Usuario.objects.get(nombre=data["auditor_lider"])