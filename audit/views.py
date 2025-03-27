from django.shortcuts import render
from .templates import *

# Create your views here.
def audit_plan(request):
    return render(request, "auditPlan.html")

def check_lists(request):
    return render(request, "checkLists.html")

def reports(request):
    return render(request, "reports.html")

