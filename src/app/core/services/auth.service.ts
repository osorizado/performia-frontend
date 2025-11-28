import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '@environments/environment';
import { StorageService } from './storage.service';

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol?: string;
  nombre_rol?: string;
  id_rol?: number;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  id_rol?: number;
  area?: string;
  cargo?: string;
}

export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  correo: string;
  rol: string;
  id_rol?: number;
  area?: string;
  cargo?: string;
}

export interface CurrentUserResponse {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  email?: string;
  area?: string;
  cargo?: string;
  id_rol: number;
  rol?: {
    id_rol: number;
    nombre_rol: string;
    descripcion?: string;
  };
  nombre_rol?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService
  ) {
    // Cargar usuario al iniciar si existe token
    const user = this.storage.getUser();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Login de usuario
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('🔥 Respuesta del login:', response);
          
          // ⭐ CRÍTICO: Guardar token con la clave que busca el interceptor
          localStorage.setItem('token', response.access_token);
          console.log('✅ Token guardado con clave "token":', response.access_token.substring(0, 20) + '...');
          
          // También guardar usando el StorageService (por compatibilidad)
          this.storage.saveToken(response.access_token, response.token_type);
          
          // Determinar el nombre del rol
          let rolName = 'Colaborador'; // Default
          
          if (response.rol) {
            rolName = response.rol;
          } else if (response.nombre_rol) {
            rolName = response.nombre_rol;
          } else if (response.id_rol) {
            // Mapeo de id_rol a nombre del rol
            rolName = this.getRoleNameById(response.id_rol);
          }
          
          // Guardar información del usuario
          const user: Usuario = {
            id_usuario: response.id_usuario,
            nombre: response.nombre,
            apellido: response.apellido,
            email: response.correo || credentials.correo,
            correo: response.correo || credentials.correo,
            rol: rolName,
            id_rol: response.id_rol
          };
          
          console.log('💾 Usuario guardado:', user);
          
          this.storage.saveUser(user);
          this.currentUserSubject.next(user);
        })
      );
  }

  /**
   * Obtener información completa del usuario actual desde el backend
   */
  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${this.apiUrl}/me`);
  }

  /**
   * Mapear id_rol a nombre del rol
   */
  private getRoleNameById(idRol: number): string {
    const roleMap: { [key: number]: string } = {
      1: 'Administrador',
      2: 'RRHH',
      3: 'Director',
      4: 'Colaborador',
      5: 'Manager'
    };
    
    return roleMap[idRol] || 'Colaborador';
  }

  /**
   * Registro de nuevo usuario
   */
  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  /**
   * Logout
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        // ⭐ IMPORTANTE: Limpiar también la clave 'token'
        localStorage.removeItem('token');
        console.log('🗑️ Token eliminado del localStorage');
        
        this.storage.clearAll();
        this.currentUserSubject.next(null);
      })
    );
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.storage.hasToken();
  }

  /**
   * Obtener usuario actual desde storage
   */
  getCurrentUserFromStorage(): Usuario | null {
    return this.storage.getUser();
  }

  /**
   * Obtener rol del usuario actual
   */
  getCurrentUserRole(): string | null {
    const user = this.getCurrentUserFromStorage();
    return user ? user.rol : null;
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const userRole = this.getCurrentUserRole();
    return userRole === role;
  }

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getCurrentUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  /**
   * Cambiar contraseña
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, {
      current_password: currentPassword,
      new_password: newPassword
    });
  }

  /**
   * Solicitar recuperación de contraseña
   */
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-password-reset`, { email });
  }

  /**
   * Resetear contraseña con token
   */
  resetPassword(email: string, codigo: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      email, 
      codigo, 
      nueva_password: newPassword
    });
  }

  /**
   * Verificar token de recuperación
   */
  verifyResetToken(email: string, codigo: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.apiUrl}/verify-reset-token`, { 
      email: email,
      codigo: codigo
    });
  }

  /**
   * Navegar al dashboard según el rol del usuario
   */
  navigateToDashboard(): void {
    const user = this.getCurrentUserFromStorage();
    console.log('🔍 Usuario actual:', user);
    
    if (!user) {
      console.error('❌ No hay usuario en storage');
      this.router.navigate(['/auth/login']);
      return;
    }
    
    const role = user.rol;
    console.log('👤 Rol del usuario:', role);
    
    switch (role) {
      case 'Administrador':
        console.log('➡️ Navegando a /admin/dashboard');
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'RRHH':
        console.log('➡️ Navegando a /rrhh/dashboard');
        this.router.navigate(['/rrhh/panel-control']);
        break;
      case 'Manager':
        console.log('➡️ Navegando a /manager/dashboard');
        this.router.navigate(['/manager/dashboard']);
        break;
      case 'Director':
        console.log('➡️ Navegando a /director/dashboard');
        this.router.navigate(['/director/dashboard']);
        break;
      case 'Colaborador':
      default:
        console.log('➡️ Navegando a /colaborador/dashboard');
        this.router.navigate(['/colaborador/dashboard']);
        break;
    }
  }

  /**
   * Confirmar correo electrónico
   */
  confirmarCorreo(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/confirmar-correo/${token}`);
  }

  /**
   * Reenviar confirmación de correo
   */
  reenviarConfirmacion(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reenviar-confirmacion`, { email });
  }
}