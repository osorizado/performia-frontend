import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EvaluacionesService, Evaluacion } from '../../../colaborador/services/evaluaciones.service';
import { EquipoService, Colaborador } from '../../services/equipo.service';
import { AuthService } from '@core/services/auth.service';

interface EvaluacionPendiente {
  id: number;
  colaborador: Colaborador;
  periodo: string;
  fecha_limite: string;
  autoevaluacion_completada: boolean;
}

interface EvaluacionCompletada {
  id: number;
  colaborador: Colaborador;
  periodo: string;
  fecha_completada: string;
  puntuacion_final: number;
}

@Component({
  selector: 'app-evaluaciones',
  templateUrl: './evaluaciones.component.html',
  styleUrls: ['./evaluaciones.component.scss']
})
export class EvaluacionesComponent implements OnInit {
  // Estados
  loading: boolean = true;
  tabActivo: 'pendientes' | 'completadas' | 'historial' = 'pendientes';
  
  // Datos
  evaluacionesPendientes: EvaluacionPendiente[] = [];
  evaluacionesCompletadas: EvaluacionCompletada[] = [];
  historialEvaluaciones: EvaluacionCompletada[] = [];
  
  // Filtros
  filtroPeriodo: string = 'todos';
  filtroColaborador: string = 'todos';
  
  // Usuario
  managerName: string = '';

  constructor(
    private evaluacionesService: EvaluacionesService,
    private equipoService: EquipoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadManagerInfo();
    this.loadEvaluacionesData();
  }

  loadManagerInfo(): void {
    const user = this.authService.getCurrentUserFromStorage();
    if (user) {
      this.managerName = user.nombre || user.email.split('@')[0];
    }
  }

  loadEvaluacionesData(): void {
    this.loading = true;
    
    // Cargar colaboradores del equipo
    this.equipoService.getMiEquipo().subscribe({
      next: (colaboradores) => {
        // Generar evaluaciones pendientes (simuladas por ahora)
        this.generarEvaluacionesPendientes(colaboradores);
        
        // Cargar evaluaciones completadas del backend
        this.loadEvaluacionesCompletadas();
        
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar colaboradores:', error);
        // Si es 422, no tiene equipo asignado
        if (error.status === 422) {
          console.warn('El manager no tiene colaboradores asignados');
          this.evaluacionesPendientes = [];
        }
        this.loading = false;
      }
    });
  }

  generarEvaluacionesPendientes(colaboradores: Colaborador[]): void {
    // TODO: En producción, esto debe venir del backend
    // Por ahora, generamos evaluaciones pendientes simuladas
    
    const periodoActual = this.getPeriodoActual();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 15); // 15 días para completar
    
    this.evaluacionesPendientes = colaboradores.map((colaborador, index) => ({
      id: index + 1,
      colaborador: colaborador,
      periodo: periodoActual,
      fecha_limite: fechaLimite.toISOString(),
      autoevaluacion_completada: Math.random() > 0.5 // Simulado
    }));
  }

  loadEvaluacionesCompletadas(): void {
    // Cargar evaluaciones completadas desde el backend
    this.evaluacionesService.getMisEvaluaciones().subscribe({
      next: (evaluaciones) => {
        // Filtrar solo las completadas
        const completadas = evaluaciones.filter(ev => ev.estado === 'completada');
        
        // Convertir a formato de vista (necesitamos datos del colaborador)
        // TODO: El backend debe incluir datos del colaborador en la respuesta
        this.evaluacionesCompletadas = [];
        this.historialEvaluaciones = [];
        
        // Por ahora, usar datos simulados
        this.generarEvaluacionesCompletadasSimuladas();
      },
      error: (error: any) => {
        console.error('Error al cargar evaluaciones completadas:', error);
        this.generarEvaluacionesCompletadasSimuladas();
      }
    });
  }

  generarEvaluacionesCompletadasSimuladas(): void {
    // TODO: Eliminar cuando el backend esté completo
    const colaboradoresEjemplo: Colaborador[] = [
      {
        id_usuario: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        correo: 'juan.perez@empresa.com',
        cargo: 'Developer',
        area: 'Tecnología',
        desempeno_promedio: 4.5,
        objetivos_completados: 5,
        objetivos_totales: 8,
        estado: 'Activo'
      },
      {
        id_usuario: 2,
        nombre: 'María',
        apellido: 'González',
        correo: 'maria.gonzalez@empresa.com',
        cargo: 'Senior Developer',
        area: 'Tecnología',
        desempeno_promedio: 4.8,
        objetivos_completados: 7,
        objetivos_totales: 8,
        estado: 'Activo'
      }
    ];

    this.evaluacionesCompletadas = [
      {
        id: 1,
        colaborador: colaboradoresEjemplo[0],
        periodo: '2025-Q3',
        fecha_completada: '2025-09-30',
        puntuacion_final: 4.5
      },
      {
        id: 2,
        colaborador: colaboradoresEjemplo[1],
        periodo: '2025-Q3',
        fecha_completada: '2025-09-28',
        puntuacion_final: 4.8
      }
    ];

    this.historialEvaluaciones = [
      ...this.evaluacionesCompletadas,
      {
        id: 3,
        colaborador: colaboradoresEjemplo[0],
        periodo: '2025-Q2',
        fecha_completada: '2025-06-30',
        puntuacion_final: 4.3
      },
      {
        id: 4,
        colaborador: colaboradoresEjemplo[1],
        periodo: '2025-Q2',
        fecha_completada: '2025-06-29',
        puntuacion_final: 4.7
      },
      {
        id: 5,
        colaborador: colaboradoresEjemplo[0],
        periodo: '2025-Q1',
        fecha_completada: '2025-03-31',
        puntuacion_final: 4.2
      }
    ];
  }

  cambiarTab(tab: 'pendientes' | 'completadas' | 'historial'): void {
    this.tabActivo = tab;
  }

  iniciarEvaluacion(colaboradorId: number): void {
    // Navegar a la vista de evaluación con el ID del colaborador
    this.router.navigate(['/manager/evaluar'], {
      queryParams: { userId: colaboradorId }
    });
  }

  verDetalleEvaluacion(evaluacionId: number): void {
    // Navegar a la vista de detalle de evaluación
    this.router.navigate(['/manager/evaluacion-detalle', evaluacionId]);
  }

  getDiasRestantes(fechaLimite: string): number {
    const hoy = new Date();
    const limite = new Date(fechaLimite);
    const diffTime = limite.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPeriodoActual(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;
    
    let trimestre = Math.ceil(mes / 3);
    return `${anio}-Q${trimestre}`;
  }

  get historialFiltrado(): EvaluacionCompletada[] {
    let resultado = [...this.historialEvaluaciones];

    // Filtrar por periodo
    if (this.filtroPeriodo !== 'todos') {
      resultado = resultado.filter(ev => ev.periodo === this.filtroPeriodo);
    }

    // Filtrar por colaborador
    if (this.filtroColaborador !== 'todos') {
      resultado = resultado.filter(ev => ev.colaborador.id_usuario.toString() === this.filtroColaborador);
    }

    return resultado;
  }

  getColaboradoresUnicos(): Colaborador[] {
    const colaboradores = new Map<number, Colaborador>();
    
    this.historialEvaluaciones.forEach(ev => {
      if (!colaboradores.has(ev.colaborador.id_usuario)) {
        colaboradores.set(ev.colaborador.id_usuario, ev.colaborador);
      }
    });

    return Array.from(colaboradores.values());
  }
}