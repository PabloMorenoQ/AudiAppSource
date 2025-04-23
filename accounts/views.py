from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from django.contrib.auth.models import Group
from .forms import Register
from .models import User
from audit.models import AuditPlan, CheckList, Report  # Asegúrate que "audit" sea tu app correcta

# Vista de registro
def register_view(request):
    if request.method == 'POST':
        form = Register(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Registro correcto')
            return redirect('home')
        else:
            username = form.cleaned_data.get('username')
            if User.objects.filter(username=username).exists():
                messages.warning(request, 'El nombre de usuario ya está en uso.')

            email = form.cleaned_data.get('email')
            if User.objects.filter(email=email).exists():
                messages.warning(request, 'El correo electrónico ya está registrado.')

            password1 = form.cleaned_data.get('password1')
            password2 = form.cleaned_data.get('password2')
            if password1 != password2:
                messages.warning(request, 'Las contraseñas no coinciden.')
    else:
        form = Register()
    return render(request, 'register.html', {'form': form})

# Vista de login
def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            nombre = form.cleaned_data.get('username')
            contraseña = form.cleaned_data.get('password')
            user = authenticate(request, username=nombre, password=contraseña)
            if user:
                messages.success(request, "Inicio de sesión correcto")
                login(request, user)
                return redirect('profile')
        else:
            messages.warning(request, 'Los datos son incorrectos')
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form})

# Vista de perfil
def profile_view(request):
    if request.user.is_authenticated:
        return render(request, "profile.html")
    else:
        messages.info(request, "Inicia sesión primero")
        return redirect('login')

# Vista de logout
def logout_view(request):
    if request.method == 'POST':
        logout(request)
        messages.success(request, "Cierre de sesión correcto")
        return redirect('register')
    return redirect('register')

# ✅ Vista del Dashboard con edición y eliminación inline
def admin_dashboard(request):
    if not request.user.is_authenticated:
        messages.warning(request, "Debes iniciar sesión para ver el dashboard.")
        return redirect('login')

    org = request.user.organization

    # Procesamiento de formularios POST
    if request.method == 'POST':
        form_type = request.POST.get('form_type')

        if form_type == 'edit_user':
            user_id = request.POST.get('user_id')
            user = get_object_or_404(User, id=user_id, organization=org)
            user.first_name = request.POST.get('first_name', user.first_name)
            user.last_name = request.POST.get('last_name', user.last_name)
            user.email = request.POST.get('email', user.email)
            user.role = request.POST.get('role', user.role)
            user.save()
            messages.success(request, f"Usuario {user.username} actualizado.")

        elif form_type == 'delete_user':
            user_id = request.POST.get('user_id')
            user = get_object_or_404(User, id=user_id, organization=org)
            user.delete()
            messages.success(request, f"Usuario eliminado.")

        return redirect('admin_dashboard')

    context = {
        'users': User.objects.filter(organization=org),
        'audit_plans': AuditPlan.objects.filter(organization=org),
        'checklists': CheckList.objects.filter(organization=org),
        'reports': Report.objects.filter(organization=org),
        'groups': Group.objects.all(),
    }
    return render(request, 'dashboard.html', context)

