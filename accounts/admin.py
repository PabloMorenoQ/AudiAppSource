# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Organization
from audit.models import CheckList, AuditPlan, Report

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Agregamos 'role' a la lista que se muestra en el listado
    list_display = ('username', 'email', 'role', 'is_active', 'is_staff')
    
    # Extendemos los fieldsets para incluir el campo 'role'
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role',)}),
    )
    
    # Si quieres que al crear un usuario también se pueda asignar 'role', extiende add_fieldsets:
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role',)}),
    )

# audit/admin.py (o el admin.py de la app donde se encuentran estos modelos)

@admin.register(CheckList)
class CheckListAdmin(admin.ModelAdmin):
    list_display = ('id', 'process', 'place', 'organization', 'dependency', 'leader_auditor')
    search_fields = ('process', 'place', 'organization__name', 'dependency', 'leader_auditor__username')
    list_filter = ('organization',)

@admin.register(AuditPlan)
class AuditPlanAdmin(admin.ModelAdmin):
    list_display = ('id', 'creation_date', 'organization', 'leader_auditor')
    search_fields = ('organization__name', 'leader_auditor__username')
    list_filter = ('creation_date', 'organization')

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'creation_date', 'organization', 'leader_auditor')
    search_fields = ('organization__name', 'leader_auditor__username')
    list_filter = ('creation_date', 'organization')

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'status')