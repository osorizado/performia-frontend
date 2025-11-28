import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-correo-confirmado',
  templateUrl: './correo-confirmado.component.html',
  styleUrls: ['./correo-confirmado.component.scss']
})
export class CorreoConfirmadoComponent implements OnInit {
  loading: boolean = true;
  confirmado: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Obtener token de la URL (parámetro de ruta)
    const token = this.route.snapshot.paramMap.get('token');
    
    if (token) {
      this.confirmarCorreo(token);
    } else {
      // Si no hay token, verificar si ya viene confirmado
      this.loading = false;
      this.confirmado = true;
    }
  }

  confirmarCorreo(token: string): void {
    this.loading = true;
    
    this.authService.confirmarCorreo(token).subscribe({
      next: (response) => {
        console.log('Correo confirmado:', response);
        this.loading = false;
        this.confirmado = true;
      },
      error: (err) => {
        console.error('Error al confirmar:', err);
        this.loading = false;
        this.confirmado = false;
        this.errorMessage = err.error?.detail || 'Token inválido o expirado';
      }
    });
  }
}