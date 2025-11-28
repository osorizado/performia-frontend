import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['./recuperar-password.component.scss']
})
export class RecuperarPasswordComponent {
  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;

  currentStep: 'email' | 'code' | 'password' = 'email';
  
  email: string = '';
  codigo: string = '';
  codeDigits: string[] = ['', '', '', '', '', ''];
  newPassword: string = '';
  confirmPassword: string = '';
  
  loading: boolean = false;
  mensaje: string = '';
  showModal: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmitEmail(): void {
    if (!this.email) {
      return;
    }

    this.loading = true;
    this.mensaje = '';

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.currentStep = 'code';
        this.showModal = true;
      },
      error: (error) => {
        this.loading = false;
        this.currentStep = 'code';
        this.showModal = true;
      }
    });
  }

  onCodeKeyDown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace') {
      event.preventDefault();
      
      if (this.codeDigits[index]) {
        this.codeDigits[index] = '';
        input.value = '';
      } else if (index > 0) {
        const prevInput = this.codeInputs.toArray()[index - 1];
        if (prevInput) {
          this.codeDigits[index - 1] = '';
          prevInput.nativeElement.value = '';
          prevInput.nativeElement.focus();
        }
      }
      
      this.codigo = this.codeDigits.join('');
      return;
    }
    
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      
      this.codeDigits[index] = event.key;
      input.value = event.key;
      this.codigo = this.codeDigits.join('');
      
      if (index < 5) {
        setTimeout(() => {
          const nextInput = this.codeInputs.toArray()[index + 1];
          if (nextInput) {
            nextInput.nativeElement.focus();
          }
        }, 10);
      }
    } else if (event.key !== 'Tab' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      event.preventDefault();
    }
  }

  onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, 6);
    
    this.codeDigits = ['', '', '', '', '', ''];
    
    digits.forEach((digit, index) => {
      this.codeDigits[index] = digit;
      const input = this.codeInputs.toArray()[index];
      if (input) {
        input.nativeElement.value = digit;
      }
    });
    
    this.codigo = this.codeDigits.join('');

    const lastIndex = Math.min(digits.length, 5);
    const input = this.codeInputs.toArray()[lastIndex];
    if (input) {
      setTimeout(() => input.nativeElement.focus(), 0);
    }
  }

  verifyCode(): void {
    if (this.codigo.length !== 6) {
      this.mensaje = 'Por favor, ingrese el código de 6 dígitos';
      return;
    }

    this.loading = true;
    this.mensaje = '';

    this.authService.verifyResetToken(this.email, this.codigo).subscribe({
      next: (response) => {
        this.loading = false;
        this.showModal = false;
        this.currentStep = 'password';
      },
      error: (error) => {
        this.loading = false;
        this.mensaje = 'Código inválido o expirado. Por favor, intente nuevamente.';
      }
    });
  }

  resendCode(): void {
    this.loading = true;
    this.codeDigits = ['', '', '', '', '', ''];
    this.codigo = '';
    
    // Limpiar inputs visuales
    this.codeInputs.forEach(input => {
      input.nativeElement.value = '';
    });

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.mensaje = 'Nuevo código enviado exitosamente';
      },
      error: (error) => {
        this.loading = false;
        this.mensaje = 'Error al reenviar el código';
      }
    });
  }

  onSubmitPassword(): void {
    if (!this.newPassword || !this.confirmPassword) {
      this.mensaje = 'Por favor, complete todos los campos';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.mensaje = 'Las contraseñas no coinciden';
      return;
    }

    if (this.newPassword.length < 8) {
      this.mensaje = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    this.loading = true;
    this.mensaje = '';

    this.authService.resetPassword(this.email, this.codigo, this.newPassword).subscribe({
      next: (response) => {
        this.loading = false;
        alert('¡Contraseña actualizada exitosamente! Ahora puede iniciar sesión.');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.loading = false;
        this.mensaje = 'Error al cambiar la contraseña. Por favor, intente nuevamente.';
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goBack(): void {
    if (this.currentStep === 'code') {
      this.currentStep = 'email';
      this.showModal = false;
      this.codeDigits = ['', '', '', '', '', ''];
      this.codigo = '';
    } else if (this.currentStep === 'password') {
      this.currentStep = 'code';
      this.showModal = true;
      this.newPassword = '';
      this.confirmPassword = '';
    }
  }

  closeModal(): void {
    this.showModal = false;
    if (this.currentStep === 'code') {
      this.currentStep = 'email';
    }
  }
}