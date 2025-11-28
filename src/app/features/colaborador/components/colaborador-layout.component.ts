import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-colaborador-layout',
  templateUrl: './colaborador-layout.component.html',
  styleUrls: ['./colaborador-layout.component.scss']
})
export class ColaboradorLayoutComponent implements OnInit {
  userName: string = '';
  userRole: string = 'Colaborador';
  sidebarCollapsed: boolean = false;

  menuItems = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/colaborador/dashboard',
      active: true
    },
    {
      label: 'Autoevaluación',
      icon: 'assessment',
      route: '/colaborador/autoevaluacion',
      active: false
    },
    {
      label: 'Mis Objetivos',
      icon: 'target',
      route: '/colaborador/objetivos',
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
      this.userRole = user.rol || 'Colaborador';
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
        // Forzar logout local aunque falle el backend
        localStorage.removeItem('access_token');
        this.router.navigate(['/auth/login']);
      }
    });
  }
}