# accounts/urls.py
from django.urls import path
from django.contrib.auth import views 
from .views import *

urlpatterns = [
    path('auditPlan/', audit_plan, name='audit_plan'),
    path('checkList/', check_lists, name='checklists'),
    path('report/', reports, name='reports'),
]
