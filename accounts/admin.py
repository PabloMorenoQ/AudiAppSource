# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Organization, RegistroAcceso
from audit.models import CheckList, AuditPlan, Report


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Agregamos 'role' a la lista que se muestra en el listado
    list_display = ('username', 'email', 'role', 'is_active', 'is_staff', 'organization') 
    
    # Extendemos los fieldsets para incluir el campo 'role'
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role',)}),
    )
    
    # Si quieres que al crear un usuario también se pueda asignar 'role', extiende add_fieldsets:
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role',)}),
    )

    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('organization',)}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('organization',)}),
    )

# audit/admin.py (o el admin.py de la app donde se encuentran estos modelos)

@admin.register(CheckList)
class CheckListAdmin(admin.ModelAdmin):
    list_display = ('id', 'process', 'place', 'organization', 'dependency', 'leader_auditor', 'audit_plan')
    search_fields = ('process', 'place', 'organization__name', 'dependency', 'leader_auditor__username')
    list_filter = ('organization', 'audit_plan')

@admin.register(AuditPlan)
class AuditPlanAdmin(admin.ModelAdmin):
    list_display = ('id', 'creation_date', 'organization', 'leader_auditor')
    search_fields = ('organization__name', 'leader_auditor__username')
    list_filter = ('creation_date', 'organization')

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'creation_date', 'organization', 'leader_auditor',)
    search_fields = ('organization__name', 'leader_auditor__username')
    list_filter = ('creation_date', 'organization')

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'status')

@admin.register(RegistroAcceso)
class RegistroAccesoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'ip', 'ruta', 'fecha')
    list_filter = ('usuario', 'fecha')
    search_fields = ('usuario__username', 'ip', 'ruta')
