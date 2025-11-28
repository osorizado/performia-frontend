import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-director-layout',
  templateUrl: './director-layout.component.html',
  styleUrls: ['./director-layout.component.scss']
})
export class DirectorLayoutComponent implements OnInit {
  userName: string = '';

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
    }
  }

  getUserInitials(): string {
    const user = this.authService.getCurrentUserFromStorage();
    if (user && user.nombre) {
      const names = user.nombre.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`
        : names[0].substring(0, 2);
    }
    return 'DR';
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error: any) => {
        console.error('Error al cerrar sesión:', error);
        // Forzar logout local si falla el backend
        localStorage.clear();
        this.router.navigate(['/auth/login']);
      }
    });
  }
}