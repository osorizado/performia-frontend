import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-manager-layout',
  templateUrl: './manager-layout.component.html',
  styleUrls: ['./manager-layout.component.scss']
})
export class ManagerLayoutComponent implements OnInit {
  userName: string = '';
  userRole: string = 'Manager';
  sidebarCollapsed: boolean = false;

  menuItems = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/manager/dashboard',
      active: true
    },
    {
      label: 'Mi Equipo',
      icon: 'team',
      route: '/manager/mi-equipo',
      active: false
    },
    {
      label: 'Evaluaciones',
      icon: 'assessment',
      route: '/manager/evaluaciones',
      active: false
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    const user = this.authService.getCurrentUserFromStorage();
    if (user) {
      this.userName = user.nombre || user.email.split('@')[0];
      this.userRole = user.rol || 'Manager';
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error: any) => {
        console.error('Error al cerrar sesión:', error);
        localStorage.removeItem('access_token');
        this.router.navigate(['/auth/login']);
      }
    });
  }
}