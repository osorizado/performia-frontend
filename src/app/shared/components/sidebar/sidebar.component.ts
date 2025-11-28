import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  menuItems: MenuItem[] = [];
  userRole = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getCurrentUserRole() || '';
    this.loadMenuItems();
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  private loadMenuItems(): void {
    // Menú base para todos los usuarios
    const baseItems: MenuItem[] = [
      { icon: 'home', label: 'Inicio', route: '/dashboard' },
      { icon: 'user', label: 'Mi Perfil', route: '/perfil' }
    ];

    // Menú según rol
    switch (this.userRole) {
      case 'Colaborador':
        this.menuItems = [
          ...baseItems,
          { icon: 'clipboard', label: 'Mis Evaluaciones', route: '/colaborador/mis-evaluaciones' },
          { icon: 'target', label: 'Mis Objetivos', route: '/colaborador/mis-objetivos' }
        ];
        break;

      case 'Manager':
        this.menuItems = [
          ...baseItems,
          { icon: 'users', label: 'Mi Equipo', route: '/manager/equipo' },
          { icon: 'clipboard', label: 'Evaluar', route: '/manager/evaluar-equipo' },
          { icon: 'target', label: 'Objetivos', route: '/manager/objetivos-equipo' },
          { icon: 'chat', label: 'Retroalimentación', route: '/manager/retroalimentacion' }
        ];
        break;

      case 'RRHH':
        this.menuItems = [
          ...baseItems,
          { icon: 'users', label: 'Usuarios', route: '/rrhh/usuarios' },
          { icon: 'document', label: 'Formularios', route: '/rrhh/formularios' },
          { icon: 'clipboard', label: 'Evaluaciones', route: '/rrhh/evaluaciones' },
          { icon: 'chart', label: 'Reportes', route: '/rrhh/reportes' }
        ];
        break;

      case 'Administrador':
        this.menuItems = [
          ...baseItems,
          { icon: 'users', label: 'Usuarios', route: '/admin/usuarios' },
          { icon: 'shield', label: 'Roles', route: '/admin/roles' },
          { icon: 'cog', label: 'Configuración', route: '/admin/configuracion' }
        ];
        break;

      case 'Director':
        this.menuItems = [
          ...baseItems,
          { icon: 'chart', label: 'Reportes Globales', route: '/director/reportes-globales' },
          { icon: 'analytics', label: 'Análisis', route: '/director/analisis' }
        ];
        break;

      default:
        this.menuItems = baseItems;
    }
  }
}
