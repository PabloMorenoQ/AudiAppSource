import os
import sys

# Ruta a tu entorno virtual (se define después en cPanel)
sys.path.insert(0, os.path.dirname(__file__))

from django.core.wsgi import get_wsgi_application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AudiApp.settings')

application = get_wsgi_application()