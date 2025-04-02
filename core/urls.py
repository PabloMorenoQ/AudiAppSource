# accounts/urls.py
from django.urls import path
from django.contrib.auth import views 
from .views import *

urlpatterns = [
    path('', home, name='home'),
]
