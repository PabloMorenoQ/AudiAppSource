from django.contrib import admin

from .models import Organizacion, Usuario

# Register your models here.
admin.site.register(Organizacion)
admin.site.register(Usuario)