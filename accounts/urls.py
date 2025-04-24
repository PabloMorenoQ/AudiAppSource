from django.urls import path
from .views import *

urlpatterns = [
    path('register/', register_view, name='register'),
    path('login/', login_view, name='login'),
    path('profile/', profile_view, name='profile'),
    path('logout/', logout_view, name='logout'),
    path('dashboard/', admin_dashboard, name='admin_dashboard'),
    path('dashboard/auditPlan/', download_excel_audit_plan, name='download_excel_audit_plan'),
    path('dashboard/checklist/', download_excel_checklist, name='download_excel_checklist'),
    path('dashboard/report/', download_excel_report, name='download_excel_report'),
]