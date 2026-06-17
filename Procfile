web: python manage.py migrate && gunicorn AudiApp.wsgi --log-file -
web: python manage.py collectstatic --noinput && python manage.py migrate && gunicorn AudiApp.wsgi --log-file -
