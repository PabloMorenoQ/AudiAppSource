# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings  # para usar el AUTH_USER_MODEL


class Organization(models.Model):
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=255)

    def __str__(self):
        return self.name
    
class User(AbstractUser):
    # AbstractUser incluye: username, password, email, is_staff, is_superuser, is_active.
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)

    ROLE_CHOICES = [
        ('superUser', 'Super User'), # administrador general de la plataforma
        ('organizationUser', 'Organization User'), # perfil corporativo que otorga roles
        ('auditUser', 'Audit User'), # perfil auditor
        ('auditLeaderUser', 'Audit Leader User'), # perfil auditor lider
    ]

    # Rol para distinguir el tipo de usuario
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='auditUser')

    # Puedes reutilizar is_active de AbstractUser para habilitar/deshabilitar al usuario
    # o bien usar un campo adicional "status" si lo prefieres.
    # is_active = models.BooleanField(default=True)  # ya viene por defecto en AbstractUser
    
    def __str__(self):
        return f"{self.first_name} - {self.username} ({self.get_role_display()})"
    
class RegistroAcceso(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL
    )
    ip = models.GenericIPAddressField()
    user_agent = models.TextField()
    ruta = models.CharField(max_length=255)
    exito = models.BooleanField()
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        estado = "Éxito" if self.exito else "Fallido"
        return f"{self.usuario} - {estado} - {self.ruta} - {self.fecha}"    
