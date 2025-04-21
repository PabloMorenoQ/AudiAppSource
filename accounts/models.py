# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


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
