import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registroForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  // Datos para selects
  areas: any[] = [];
  roles: any[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      repetir_password: ['', Validators.required],
      puesto: ['', Validators.required],
      id_area: ['', Validators.required],
      id_rol: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarAreas();
    this.cargarRoles();
  }

  cargarAreas(): void {
    this.areas = [
      { id_area: 1, nombre: 'Desarrollo' },
      { id_area: 2, nombre: 'QA / Testing' },
      { id_area: 3, nombre: 'DevOps' },
      { id_area: 4, nombre: 'UX/UI Design' },
      { id_area: 5, nombre: 'Producto' },
      { id_area: 6, nombre: 'Recursos Humanos' },
      { id_area: 7, nombre: 'Gerencia' }
    ];
  }

  cargarRoles(): void {
    this.roles = [
      { id_rol: 4, nombre: 'Colaborador' },
      { id_rol: 3, nombre: 'Manager / Líder de Equipo' },
      { id_rol: 2, nombre: 'Especialista RRHH' },
      { id_rol: 1, nombre: 'Administrador' },
      { id_rol: 5, nombre: 'Director / Gerente' }
    ];
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      this.errorMessage = 'Por favor, completa todos los campos requeridos.';
      return;
    }

    const formValues = this.registroForm.value;

    if (formValues.password !== formValues.repetir_password) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    const areaSeleccionada = this.areas.find(a => a.id_area === parseInt(formValues.id_area));

    const requestBody = {
      nombre: formValues.nombre,
      apellido: formValues.apellido,
      email: formValues.email,
      telefono: formValues.telefono || null,
      password: formValues.password,
      puesto: formValues.puesto,
      area: areaSeleccionada?.nombre || '',
      id_rol: parseInt(formValues.id_rol)
    };

    console.log('Enviando registro:', requestBody);

    this.authService.register(requestBody).subscribe({
      next: (res) => {
        console.log('Usuario registrado con éxito', res);
        this.loading = false;
        this.successMessage = 'Registro exitoso. Redirigiendo...';
        
        // ✅ Guardar email para poder reenviar confirmación
        localStorage.setItem('pendingEmail', formValues.email);
        
        setTimeout(() => {
          this.router.navigate(['/auth/confirmar-correo']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error en el registro', err);
        this.loading = false;
        this.errorMessage = err.error?.detail || err.error?.message || 'Error al registrarse. Verifica tus datos.';
      }
    });
  }
}