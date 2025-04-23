from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from .forms import Register
from .models import User

# Create your views here.
def register_view(request):
    if request.method == 'POST':
        form = Register(request.POST)
        if form.is_valid():
            user = form.save()
            user.save()
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

    form.fields['username'].widget.attrs.update({'class': 'form-control w-100'})
    form.fields['email'].widget.attrs.update({'class': 'form-control w-100'})
    form.fields['role'].widget.attrs.update({'class': 'form-control w-100'})
    form.fields['organization'].widget.attrs.update({'class': 'form-control w-100'})
    form.fields['password1'].widget.attrs.update({'class': 'form-control w-100'})
    form.fields['password2'].widget.attrs.update({'class': 'form-control w-100'})
    return render(request, 'register.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            nombre = form.cleaned_data.get('username')
            contraseña = form.cleaned_data.get('password')
            user = authenticate(request, username = nombre, password = contraseña)
            if user:
                messages.success(request, "Inicio de sesión correcto")
                login(request, user)
                return redirect('profile')
        else:
            messages.warning(request, 'Los datos son incorrectos')
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form})

def profile_view(request):
    if request.user.is_authenticated:
        return render(request, "profile.html",)
    else:
        messages.info(request, "Inicia sesión primero")
        return redirect('login')
    
def logout_view(request):
    if request.method == 'POST':
        logout(request)
        messages.success(request, "Cierre de sesión correcto")
        return redirect('register')
    return redirect('register')