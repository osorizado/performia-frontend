import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { finalize } from 'rxjs/operators'; // ⭐ AGREGAR ESTO

import Swal from 'sweetalert2';

interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  cargo?: string;
  area?: string;
  id_rol: number;
  manager_id?: number;
  manager_nombre?: string;
  estado: string;
  fecha_ingreso?: string;
}

interface Manager {
  id_usuario: number;
  nombre: string;
  apellido: string;
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit {
  loading: boolean = true;
  guardando: boolean = false;
  mostrarModal: boolean = false;
  modoEdicion: boolean = false;
  
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  listaManagers: Manager[] = [];
  
  usuarioForm: FormGroup;
  usuarioSeleccionado: Usuario | null = null;
  
  // Filtros
  searchTerm: string = '';
  filtroRol: string = 'todos';
  filtroEstado: string = 'todos';
  
  mostrarSelectorManager: boolean = false;

  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.usuarioForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: [''],
      cargo: [''],
      area: [''],
      id_rol: ['', Validators.required],
      manager_id: [''],
      estado: ['Activo', Validators.required],
      password: ['', Validators.minLength(6)]
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  cargarUsuarios(): void {
    this.loading = true;

    // Llamada real al backend
    this.http.get<Usuario[]>(`${this.apiUrl}/users`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.usuariosFiltrados = usuarios;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar usuarios:', error);
        // Usar datos mock si falla
        this.cargarUsuariosMock();
        this.loading = false;
      }
    });
  }

  cargarUsuariosMock(): void {
    // Datos de prueba
    this.usuarios = [
      {
        id_usuario: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        correo: 'juan.perez@empresa.com',
        cargo: 'Colaborador',
        area: 'TI',
        id_rol: 2,
        manager_id: 3,
        manager_nombre: 'Carlos Manager',
        estado: 'Activo'
      },
      {
        id_usuario: 2,
        nombre: 'María',
        apellido: 'González',
        correo: 'maria.gonzalez@empresa.com',
        cargo: 'Colaborador',
        area: 'Ventas',
        id_rol: 2,
        estado: 'Activo'
      },
      {
        id_usuario: 3,
        nombre: 'Carlos',
        apellido: 'Manager',
        correo: 'carlos.manager@empresa.com',
        cargo: 'Manager',
        area: 'TI',
        id_rol: 3,
        estado: 'Activo'
      },
      {
        id_usuario: 8,
        nombre: 'Laura',
        apellido: 'Jimenez',
        correo: 'ljimenez@pucp.edu.pe',
        cargo: 'Analyst',
        area: 'Operaciones',
        id_rol: 2,
        estado: 'Activo'
      },
      {
        id_usuario: 9,
        nombre: 'Percy',
        apellido: 'Marca Rojas',
        correo: 'plmarca@pucp.edu.pe',
        cargo: 'Analyst',
        area: 'Gerencia',
        id_rol: 3,
        estado: 'Activo'
      }
    ];
    this.usuariosFiltrados = [...this.usuarios];
  }

  cargarManagers(): void {
    // Cargar lista de managers disponibles - CORREGIDO
    this.http.get<any[]>(`${this.apiUrl}/users/`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (usuarios) => {
        // Filtrar solo managers (rol 3)
        this.listaManagers = usuarios
          .filter(u => u.id_rol === 3)
          .map(u => ({
            id_usuario: u.id_usuario,
            nombre: u.nombre,
            apellido: u.apellido
          }));
      },
      error: (error: any) => {
        console.error('Error al cargar managers:', error);
        // Filtrar managers de la lista actual
        this.listaManagers = this.usuarios
          .filter(u => u.id_rol === 3)
          .map(u => ({
            id_usuario: u.id_usuario,
            nombre: u.nombre,
            apellido: u.apellido
          }));
      }
    });
  }

  filtrarUsuarios(): void {
    this.usuariosFiltrados = this.usuarios.filter(usuario => {
      // Filtro de búsqueda
      const matchSearch = this.searchTerm === '' || 
        usuario.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        usuario.apellido.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        usuario.correo.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Filtro de rol
      const matchRol = this.filtroRol === 'todos' || 
        usuario.id_rol.toString() === this.filtroRol;

      // Filtro de estado
      const matchEstado = this.filtroEstado === 'todos' || 
        usuario.estado === this.filtroEstado;

      return matchSearch && matchRol && matchEstado;
    });
  }

  onRolChange(): void {
    const rolSeleccionado = this.usuarioForm.get('id_rol')?.value;
    
    // Si el rol es Colaborador (2), mostrar selector de manager
    if (rolSeleccionado === '2') {
      this.mostrarSelectorManager = true;
      this.cargarManagers();
    } else {
      this.mostrarSelectorManager = false;
      this.usuarioForm.patchValue({ manager_id: '' });
    }
  }

  abrirModalNuevoUsuario(): void {
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
    this.mostrarSelectorManager = false;
    this.usuarioForm.reset({
      estado: 'Activo'
    });
    this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.mostrarModal = true;
  }

  editarUsuario(usuario: Usuario): void {
    this.modoEdicion = true;
    this.usuarioSeleccionado = usuario;
    
    this.usuarioForm.patchValue({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      telefono: usuario.telefono || '',
      cargo: usuario.cargo || '',
      area: usuario.area || '',
      id_rol: usuario.id_rol.toString(),
      manager_id: usuario.manager_id || '',
      estado: usuario.estado
    });

    // Verificar si debe mostrar selector de manager
    if (usuario.id_rol === 2) {
      this.mostrarSelectorManager = true;
      this.cargarManagers();
    }

    // En modo edición, la contraseña es opcional
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('password')?.updateValueAndValidity();

    this.mostrarModal = true;
  }
guardarUsuario() {
  if (this.usuarioForm.invalid) {
    Swal.fire({
      title: 'Error',
      text: 'Por favor completa todos los campos requeridos',
      icon: 'warning'
    });
    return;
  }

  this.guardando = true;
  const formData = this.usuarioForm.value;
  console.log('📤 Datos del formulario:', formData);

  // ✅ MAPEA LOS CAMPOS CORRECTAMENTE PARA EL BACKEND
  const usuarioData = {
    nombre: formData.nombre,
    apellido: formData.apellido,
    email: formData.correo,        // ⭐ CAMBIO: correo → email
    telefono: formData.telefono,
    puesto: formData.cargo,         // ⭐ CAMBIO: cargo → puesto
    area: formData.area,
    id_rol: parseInt(formData.id_rol),
    manager_id: formData.manager_id ? parseInt(formData.manager_id) : null,
    estado: formData.estado,
    password: formData.password
  };

  console.log('📤 Datos a enviar al backend:', usuarioData);

  if (this.modoEdicion && this.usuarioSeleccionado) {
    // EDITAR USUARIO EXISTENTE
    this.http.put(
      `${this.apiUrl}/users/${this.usuarioSeleccionado.id_usuario}`,
      usuarioData,
      { headers: this.getHeaders() }
    ).pipe(
      finalize(() => this.guardando = false)
    ).subscribe({
      next: (response: any) => {
        console.log('✅ Usuario actualizado:', response);
        Swal.fire({
          title: 'Éxito',
          text: 'Usuario actualizado correctamente',
          icon: 'success'
        });
        this.cerrarModal();
        this.cargarUsuarios();
      },
      error: (error: any) => {
        console.error('❌ Error al actualizar usuario:', error);
        console.error('📋 Detalles del error:', JSON.stringify(error.error, null, 2));
        
        let errorMsg = 'Error al actualizar usuario';
        if (error.error && error.error.detail) {
          if (Array.isArray(error.error.detail)) {
            errorMsg = error.error.detail.map((e: any) => e.msg).join(', ');
          } else {
            errorMsg = error.error.detail;
          }
        }
        
        Swal.fire({
          title: 'Error',
          text: errorMsg,
          icon: 'error'
        });
      }
    });
  } else {
    // CREAR NUEVO USUARIO
    this.http.post(
      `${this.apiUrl}/auth/register`,
      usuarioData,
      { headers: this.getHeaders() }
    ).pipe(
      finalize(() => this.guardando = false)
    ).subscribe({
      next: (response: any) => {
        console.log('✅ Usuario creado:', response);
        Swal.fire({
          title: 'Éxito',
          text: 'Usuario creado correctamente',
          icon: 'success'
        });
        this.cerrarModal();
        this.cargarUsuarios();
      },
      error: (error: any) => {
        console.error('❌ Error al crear usuario:', error);
        console.error('📋 Detalles del error:', JSON.stringify(error.error, null, 2));
        console.error('📤 Datos enviados:', usuarioData);
        
        let errorMsg = 'Error al crear usuario';
        if (error.error && error.error.detail) {
          if (Array.isArray(error.error.detail)) {
            errorMsg = error.error.detail.map((e: any) => e.msg).join(', ');
          } else {
            errorMsg = error.error.detail;
          }
        }
        
        Swal.fire({
          title: 'Error',
          text: errorMsg,
          icon: 'error'
        });
      }
    });
  }
}

  toggleEstadoUsuario(usuario: Usuario): void {
    const nuevoEstado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
    const accion = nuevoEstado === 'Activo' ? 'activar' : 'desactivar';

    if (!confirm(`¿Está seguro de ${accion} a ${usuario.nombre} ${usuario.apellido}?`)) {
      return;
    }

    this.http.put(`${this.apiUrl}/users/${usuario.id_usuario}/estado`, 
      { estado: nuevoEstado },
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        usuario.estado = nuevoEstado;
        alert(`Usuario ${accion}do exitosamente`);
      },
      error: (error: any) => {
        console.error('Error al cambiar estado:', error);
        alert('Error al cambiar el estado del usuario');
      }
    });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.guardando = false;
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
    this.mostrarSelectorManager = false;
    this.usuarioForm.reset();
  }

  getInitials(nombre: string, apellido: string): string {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  }

  getRolNombre(idRol: number): string {
    const roles: {[key: number]: string} = {
      1: 'Admin',
      2: 'Colaborador',
      3: 'Manager',
      4: 'RRHH'
    };
    return roles[idRol] || 'Desconocido';
  }

  getRolClass(idRol: number): string {
    const classes: {[key: number]: string} = {
      1: 'badge-admin',
      2: 'badge-colaborador',
      3: 'badge-manager',
      4: 'badge-rrhh'
    };
    return classes[idRol] || 'badge-default';
  }
}