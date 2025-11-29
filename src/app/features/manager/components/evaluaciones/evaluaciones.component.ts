import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EvaluacionesService } from '../../../colaborador/services/evaluaciones.service';
import { EquipoService, Colaborador } from '../../services/equipo.service';
import { AuthService } from '@core/services/auth.service';
import { forkJoin } from 'rxjs';

interface EvaluacionPendiente {
  id_evaluacion: number;
  id_colaborador: number;
  nombre_colaborador: string;
  apellido_colaborador: string;
  cargo: string;
  area: string;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_evaluacion: string;
  es_autoevaluacion: boolean;
}

interface EvaluacionCompletada {
  id_evaluacion: number;
  id_colaborador: number;
  nombre_colaborador: string;
  apellido_colaborador: string;
  cargo: string;
  periodo: string;
  fecha_completada: string;
  puntaje_total: number;
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
  colaboradoresMap: Map<number, Colaborador> = new Map();
  
  // Filtros
  filtroPeriodo: string = 'todos';
  filtroColaborador: string = 'todos';
  periodosDisponibles: string[] = [];
  
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
    
    // ✅ CAMBIO: Usar los nuevos endpoints específicos para managers
    forkJoin({
      colaboradores: this.equipoService.getMiEquipo(),
      evaluacionesPendientes: this.evaluacionesService.getEvaluacionesPendientesManager(), // ✅ NUEVO
      evaluacionesCompletadas: this.evaluacionesService.getEvaluacionesEquipoCompletadas() // ✅ NUEVO
    }).subscribe({
      next: (response) => {
        // Procesar colaboradores
        this.procesarColaboradores(response.colaboradores);
        
        // Procesar evaluaciones pendientes
        this.procesarEvaluacionesPendientes(response.evaluacionesPendientes);
        
        // Procesar evaluaciones completadas
        this.procesarEvaluacionesCompletadas(response.evaluacionesCompletadas);
        
        // Extraer períodos únicos
        this.extraerPeriodos();
        
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar datos:', error);
        this.loading = false;
        
        // Manejar caso donde no hay equipo
        if (error.status === 422 || error.status === 404) {
          this.evaluacionesPendientes = [];
          this.evaluacionesCompletadas = [];
          this.historialEvaluaciones = [];
        }
      }
    });
  }

  procesarColaboradores(colaboradores: Colaborador[]): void {
    colaboradores.forEach(col => {
      this.colaboradoresMap.set(col.id_usuario, col);
    });
  }

  procesarEvaluacionesPendientes(evaluaciones: any[]): void {
    this.evaluacionesPendientes = evaluaciones
      .filter(ev => ev.estado === 'Pendiente' || ev.estado === 'En Curso')
      .map(ev => {
        const colaborador = this.colaboradoresMap.get(ev.id_evaluado);
        const esAutoevaluacion = ev.id_evaluador === ev.id_evaluado;
        
        return {
          id_evaluacion: ev.id_evaluacion,
          id_colaborador: ev.id_evaluado,
          nombre_colaborador: colaborador?.nombre || 'N/A',
          apellido_colaborador: colaborador?.apellido || '',
          cargo: colaborador?.cargo || 'N/A',
          area: colaborador?.area || 'N/A',
          periodo: ev.periodo,
          fecha_inicio: ev.fecha_inicio,
          fecha_fin: ev.fecha_fin,
          tipo_evaluacion: ev.tipo_evaluacion,
          es_autoevaluacion: esAutoevaluacion
        };
      });
  }

  procesarEvaluacionesCompletadas(evaluaciones: any[]): void {
    const completadas = evaluaciones
      .filter(ev => ev.estado === 'Completada')
      .map(ev => {
        const colaborador = this.colaboradoresMap.get(ev.id_evaluado);
        return {
          id_evaluacion: ev.id_evaluacion,
          id_colaborador: ev.id_evaluado,
          nombre_colaborador: colaborador?.nombre || 'N/A',
          apellido_colaborador: colaborador?.apellido || '',
          cargo: colaborador?.cargo || 'N/A',
          periodo: ev.periodo,
          fecha_completada: ev.fecha_modificacion || ev.fecha_creacion,
          puntaje_total: ev.puntaje_total || 0
        };
      });

    // Últimas 5 completadas
    this.evaluacionesCompletadas = completadas.slice(0, 5);
    
    // Todas para el historial
    this.historialEvaluaciones = completadas;
  }

  extraerPeriodos(): void {
    const periodos = new Set<string>();
    
    this.historialEvaluaciones.forEach(ev => {
      if (ev.periodo) {
        periodos.add(ev.periodo);
      }
    });
    
    this.periodosDisponibles = Array.from(periodos).sort((a, b) => b.localeCompare(a));
  }

  cambiarTab(tab: 'pendientes' | 'completadas' | 'historial'): void {
    this.tabActivo = tab;
  }

  iniciarEvaluacion(evaluacionId: number): void {
    // Navegar a la vista de realizar evaluación (usa el ID de la evaluación)
    this.router.navigate(['/manager/realizar-evaluacion', evaluacionId]);
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
    const trimestre = Math.ceil(mes / 3);
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
      resultado = resultado.filter(ev => 
        ev.id_colaborador.toString() === this.filtroColaborador
      );
    }

    return resultado;
  }

  getColaboradoresUnicos(): Colaborador[] {
    const colaboradores = new Map<number, Colaborador>();
    
    this.historialEvaluaciones.forEach(ev => {
      const col = this.colaboradoresMap.get(ev.id_colaborador);
      if (col && !colaboradores.has(ev.id_colaborador)) {
        colaboradores.set(ev.id_colaborador, col);
      }
    });

    return Array.from(colaboradores.values());
  }

  // Métodos auxiliares para la vista
  getEstadoColor(diasRestantes: number): string {
    if (diasRestantes <= 0) return 'danger';
    if (diasRestantes < 7) return 'warning';
    return 'success';
  }

  getPuntuacionColor(puntaje: number): string {
    if (puntaje >= 4.5) return 'success';
    if (puntaje >= 4.0) return 'info';
    if (puntaje >= 3.5) return 'warning';
    return 'danger';
  }

  formatearPuntaje(puntaje: any): string {
  if (puntaje === null || puntaje === undefined) {
    return 'N/A';
  }
  // Convertir a número si es string
  const numero = typeof puntaje === 'number' ? puntaje : parseFloat(puntaje);
  
  if (isNaN(numero)) {
    return 'N/A';
  }
  
  return numero.toFixed(1);
}
}