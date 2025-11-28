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
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ha ocurrido un error';

        if (error.error instanceof ErrorEvent) {
          // Error del cliente
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Error del servidor
          switch (error.status) {
            case 401:
              // No autorizado - redirigir a login
              errorMessage = 'No autorizado. Por favor, inicie sesión.';
              this.authService.logout();
              break;
            case 403:
              // Prohibido
              errorMessage = 'No tiene permisos para realizar esta acción.';
              break;
            case 404:
              // No encontrado
              errorMessage = 'Recurso no encontrado.';
              break;
            case 500:
              // Error del servidor
              errorMessage = 'Error del servidor. Intente más tarde.';
              break;
            default:
              errorMessage = error.error?.message || error.message || 'Ha ocurrido un error';
          }
        }

        console.error('Error HTTP:', errorMessage, error);
        return throwError(() => ({ ...error, friendlyMessage: errorMessage }));
      })
    );
  }
}
