import { Component, OnInit } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-confirmar-correo',
  templateUrl: './confirmar-correo.component.html',
  styleUrls: ['./confirmar-correo.component.scss']
})
export class ConfirmarCorreoComponent implements OnInit {
  loading: boolean = false;
  mensaje: string = '';
  error: string = '';
  email: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Obtener email del localStorage si existe
    this.email = localStorage.getItem('pendingEmail') || '';
  }

  reenviarCorreo(): void {
    if (!this.email) {
      this.error = 'No se encontró el correo. Por favor, regístrate de nuevo.';
      return;
    }

    this.loading = true;
    this.mensaje = '';
    this.error = '';

    this.authService.reenviarConfirmacion(this.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.mensaje = response.message || 'Correo reenviado exitosamente.';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Error al reenviar el correo.';
      }
    });
  }
}