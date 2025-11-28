import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Obtener los roles permitidos desde la configuración de la ruta
    const allowedRoles = route.data['roles'] as string[];
    
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      console.log('❌ Usuario no autenticado');
      return this.router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Verificar si el usuario tiene uno de los roles permitidos
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = this.authService.getCurrentUserRole();
      
      if (userRole && allowedRoles.includes(userRole)) {
        console.log(`✅ Usuario con rol ${userRole} tiene acceso`);
        return true;
      } else {
        console.log(`❌ Usuario con rol ${userRole} no tiene acceso. Roles permitidos:`, allowedRoles);
        // Redirigir al dashboard correspondiente según su rol
        this.authService.navigateToDashboard();
        return false;
      }
    }

    // Si no hay roles específicos, permitir acceso
    return true;
  }
}