import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EquipoService, Colaborador, EstadisticasEquipo } from '../../services/equipo.service';
import { EvaluacionesService } from '../../../colaborador/services/evaluaciones.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-manager-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class ManagerDashboardComponent implements OnInit {
  // Datos del manager
  managerName: string = '';
  
  // Estadísticas
  estadisticas: EstadisticasEquipo = {
    total_colaboradores: 0,
    evaluaciones_completadas: 0,
    evaluaciones_pendientes: 0,
    desempeno_promedio: 0,
    objetivos_en_curso: 0
  };

  // Lista de colaboradores
  colaboradores: Colaborador[] = [];
  
  // Estados
  loading: boolean = true;
  loadingEstadisticas: boolean = true;
  loadingColaboradores: boolean = true;

  constructor(
    private equipoService: EquipoService,
    private evaluacionesService: EvaluacionesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadManagerInfo();
    this.loadDashboardData();
  }

  loadManagerInfo(): void {
    const user = this.authService.getCurrentUserFromStorage();
    if (user) {
      this.managerName = user.nombre || user.email.split('@')[0];
    }
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Cargar estadísticas del equipo
    this.loadEstadisticas();
    
    // Cargar colaboradores
    this.loadColaboradores();
  }

  loadEstadisticas(): void {
    this.loadingEstadisticas = true;
    
    // Llamada real al backend
    this.equipoService.getEstadisticasEquipo().subscribe({
      next: (estadisticas) => {
        this.estadisticas = estadisticas;
        this.loadingEstadisticas = false;
        this.checkAllLoaded();
      },
      error: (error: any) => {
        console.error('Error al cargar estadísticas:', error);
        // En caso de error, usar valores por defecto
        this.estadisticas = {
          total_colaboradores: 0,
          evaluaciones_completadas: 0,
          evaluaciones_pendientes: 0,
          desempeno_promedio: 0,
          objetivos_en_curso: 0
        };
        this.loadingEstadisticas = false;
        this.checkAllLoaded();
      }
    });
  }

  loadColaboradores(): void {
    this.loadingColaboradores = true;
    
    // Llamada real al backend
    this.equipoService.getMiEquipo().subscribe({
      next: (colaboradores) => {
        this.colaboradores = colaboradores;
        this.loadingColaboradores = false;
        this.checkAllLoaded();
      },
      error: (error: any) => {
        console.error('Error al cargar colaboradores:', error);
        this.colaboradores = [];
        this.loadingColaboradores = false;
        this.checkAllLoaded();
      }
    });
  }

  checkAllLoaded(): void {
    if (!this.loadingEstadisticas && !this.loadingColaboradores) {
      this.loading = false;
    }
  }

  verDetallesColaborador(colaborador: Colaborador): void {
    // Navegar a la vista de detalles del colaborador
    this.router.navigate(['/manager/mi-equipo'], { 
      queryParams: { userId: colaborador.id_usuario }
    });
  }

 evaluarColaborador(colaborador: Colaborador): void {
  // Navegar a evaluar colaborador (usa el ID del colaborador)
  this.router.navigate(['/manager/evaluar'], {
    queryParams: { userId: colaborador.id_usuario }
  });
}

  verTodosColaboradores(): void {
    this.router.navigate(['/manager/mi-equipo']);
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'Completada':
        return 'badge-success';
      case 'En Curso':
        return 'badge-warning';
      case 'Pendiente':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  }

  getDesempenoColor(desempeno: number): string {
    if (desempeno >= 4.5) return 'success';
    if (desempeno >= 4.0) return 'info';
    if (desempeno >= 3.5) return 'warning';
    return 'danger';
  }
}