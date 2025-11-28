// ARCHIVO: src/app/core/interceptors/auth.interceptor.ts
// Interceptor para agregar automáticamente el token JWT a todas las peticiones HTTP

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    
    console.log('🔒 Interceptor activado');
    console.log('📍 URL:', request.url);
    console.log('🎫 Token encontrado:', token ? 'Sí' : 'No');

    // Si hay token, clonamos la petición y agregamos el header Authorization
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ Token agregado al header Authorization');
    } else {
      console.warn('⚠️ No se encontró token en localStorage');
    }

    // Enviamos la petición y manejamos errores
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error en la petición HTTP:', error);

        if (error.status === 401) {
          console.error('🚫 Error 401: No autorizado - Token inválido o expirado');
          
          // Opcional: Redirigir al login si el token expiró
          // localStorage.removeItem('token');
          // this.router.navigate(['/login']);
        }

        if (error.status === 403) {
          console.error('🚫 Error 403: Acceso prohibido - No tienes permisos');
        }

        return throwError(() => error);
      })
    );
  }
}