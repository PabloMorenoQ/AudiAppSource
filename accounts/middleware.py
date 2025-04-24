from .models import RegistroAcceso

class MiddlewareRegistroAcceso:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.user.is_authenticated:
            RegistroAcceso.objects.create(
                usuario=request.user,
                ip=self.obtener_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                ruta=request.path,
                exito=True
            )

        return response

    def obtener_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')
