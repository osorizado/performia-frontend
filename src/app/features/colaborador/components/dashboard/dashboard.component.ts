import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ObjetivosService, Objetivo } from '../../services/objetivos.service';
import { EvaluacionesService, Evaluacion, EvaluacionPendiente } from '../../services/evaluaciones.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-colaborador-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class ColaboradorDashboardComponent implements OnInit {
  // Datos del usuario
  userName: string = '';
  userEmail: string = '';

  // Estadísticas principales
  objetivosCompletados: number = 0;
  totalObjetivos: number = 0;
  progresoPromedio: number = 0;
  diasParaEvaluacion: number = 0;
  ultimaPuntuacion: number = 0;

  // Listas de datos
  misObjetivos: Objetivo[] = [];
  evaluacionesPendientes: EvaluacionPendiente[] = [];
  historialEvaluaciones: Evaluacion[] = [];

  // Estados de carga
  loading: boolean = true;
  loadingObjetivos: boolean = true;
  loadingEvaluaciones: boolean = true;

  // Estado emocional
  estadoEmocional: 'feliz' | 'neutral' | 'preocupado' | null = null;

  constructor(
    private objetivosService: ObjetivosService,
    private evaluacionesService: EvaluacionesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadDashboardData();
  }

  loadUserInfo(): void {
    const user = this.authService.getCurrentUserFromStorage();
    if (user) {
      this.userName = user.nombre || user.email.split('@')[0];
      this.userEmail = user.email;
    }
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Cargar objetivos
    this.loadObjetivos();
    
    // Cargar evaluaciones
    this.loadEvaluaciones();
  }

  loadObjetivos(): void {
    this.loadingObjetivos = true;
    this.objetivosService.getMisObjetivos().subscribe({
      next: (objetivos) => {
        this.misObjetivos = objetivos;
        this.totalObjetivos = objetivos.length;
        
        // Calcular objetivos completados
        this.objetivosCompletados = objetivos.filter(obj => obj.estado === 'Completado').length;
        
        // Calcular progreso promedio
        if (objetivos.length > 0) {
          const sumaProgreso = objetivos.reduce((sum, obj) => sum + obj.progreso, 0);
          this.progresoPromedio = Math.round(sumaProgreso / objetivos.length);
        }
        
        this.loadingObjetivos = false;
        this.checkAllLoaded();
      },
      error: (error: any) => {
        console.error('Error al cargar objetivos:', error);
        this.loadingObjetivos = false;
        this.checkAllLoaded();
      }
    });
  }

  loadEvaluaciones(): void {
    this.loadingEvaluaciones = true;
    
    // Cargar evaluaciones pendientes
    this.evaluacionesService.getEvaluacionesPendientes().subscribe({
      next: (pendientes) => {
        this.evaluacionesPendientes = pendientes;
        
        // Calcular días para próxima evaluación
        if (pendientes.length > 0) {
          const fechaLimite = new Date(pendientes[0].fecha_limite);
          const hoy = new Date();
          const diffTime = fechaLimite.getTime() - hoy.getTime();
          this.diasParaEvaluacion = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      },
      error: (error: any) => {
        console.error('Error al cargar evaluaciones pendientes:', error);
      }
    });
    
    // Cargar historial de evaluaciones
    this.evaluacionesService.getMisEvaluaciones().subscribe({
      next: (evaluaciones) => {
        this.historialEvaluaciones = evaluaciones
          .filter(ev => ev.estado === 'completada')
          .sort((a, b) => new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime())
          .slice(0, 4); // Últimas 4 evaluaciones
        
        // Obtener última puntuación
        if (this.historialEvaluaciones.length > 0 && this.historialEvaluaciones[0].puntuacion_final) {
          this.ultimaPuntuacion = this.historialEvaluaciones[0].puntuacion_final;
        }
        
        this.loadingEvaluaciones = false;
        this.checkAllLoaded();
      },
      error: (error: any) => {
        console.error('Error al cargar historial de evaluaciones:', error);
        this.loadingEvaluaciones = false;
        this.checkAllLoaded();
      }
    });
  }

  checkAllLoaded(): void {
    if (!this.loadingObjetivos && !this.loadingEvaluaciones) {
      this.loading = false;
    }
  }

  // Métodos para acciones
  iniciarAutoevaluacion(): void {
    if (this.evaluacionesPendientes.length > 0) {
      this.router.navigate(['/colaborador/autoevaluacion']);
    }
  }

  verTodosObjetivos(): void {
    this.router.navigate(['/colaborador/objetivos']);
  }

  setEstadoEmocional(estado: 'feliz' | 'neutral' | 'preocupado'): void {
    this.estadoEmocional = estado;
    // Aquí podrías guardar el estado emocional en el backend
    console.log('Estado emocional seleccionado:', estado);
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'Completado':
        return 'badge-success';
      case 'En Curso':
        return 'badge-warning';
      case 'En Pausa':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  }

  getPeriodoFormateado(fecha: string): string {
    const date = new Date(fecha);
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[date.getMonth()]} ${date.getFullYear()}`;
  }

  getProgresoColor(progreso: number): string {
    if (progreso >= 90) return 'success';
    if (progreso >= 75) return 'info';
    if (progreso >= 60) return 'warning';
    return 'danger';
  }
}