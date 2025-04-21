from django.urls import path
from .views import *

urlpatterns = [
    path('auditPlan/', audit_plan, name='audit_plan'),
    path('checkList/', check_lists, name='checklists'),
    path('checkList/save_checklist/', save_checklist, name='save_checklist'),
    path('checkList/download_excel/', download_excel, name='download_excel'),
    path('report/', reports, name='reports'),
]
