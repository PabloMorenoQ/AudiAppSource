from django.urls import path
from .views import *

urlpatterns = [
    path('auditPlan/', audit_plan, name='audit_plan'),
    path('checkList/', check_lists, name='checklists'),
    path('checkList/save/', save_checklist, name='save_checklist'),
    path('report/', reports, name='reports'),
    path('report/save/', save_report, name='save_report'),
    path('excel/', excel_landing, name='excel_landing'),
    # path('excel/download/', download_excel, name='download_excel'),
]
