from django.urls import path
from .views import *

urlpatterns = [
    path('auditPlan/', audit_plan, name='audit_plan'),
    path('checkList/', check_lists, name='checklists'),
    path('report/', reports, name='reports'),
]
