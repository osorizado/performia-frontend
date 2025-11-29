import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EquipoService, Colaborador } from '../../services/equipo.service';
import { EvaluacionesService } from '../../../colaborador/services/evaluaciones.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-mi-equipo',
  templateUrl: './mi-equipo.component.html',
  styleUrls: ['./mi-equipo.component.scss']
})
export class MiEquipoComponent implements OnInit {
  colaboradores: Colaborador[] = [];
  filtroEstado: string = 'todos';
  busqueda: string = '';
  loading: boolean = true;

  constructor(
    private equipoService: EquipoService,
    private evaluacionesService: EvaluacionesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadColaboradores();
    this.checkQueryParams();
  }

  checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['userId']) {
        const userId = parseInt(params['userId']);
        console.log('Mostrar detalles del colaborador:', userId);
      }
    });
  }

  loadColaboradores(): void {
  this.loading = true;
  
  forkJoin({
    colaboradores: this.equipoService.getMiEquipo(),
    evaluacionesPendientes: this.evaluacionesService.getEvaluacionesPendientesManager(),
    evaluacionesCompletadas: this.evaluacionesService.getEvaluacionesEquipoCompletadas()
  }).subscribe({
    next: (resultado) => {
      this.colaboradores = resultado.colaboradores.map(col => {
        // Buscar si tiene evaluación pendiente
        const evaluacionPendiente = resultado.evaluacionesPendientes.find(
          (ev: any) => ev.id_evaluado === col.id_usuario
        );
        
        // Buscar si tiene evaluación completada
        const evaluacionCompletada = resultado.evaluacionesCompletadas.find(
          (ev: any) => ev.id_evaluado === col.id_usuario
        );
        
        // Determinar estado real con tipo correcto
        let estadoEvaluacion: 'Completada' | 'En Curso' | 'Pendiente' = 'Pendiente';
        if (evaluacionCompletada) {
          estadoEvaluacion = 'Completada';
        } else if (evaluacionPendiente && evaluacionPendiente.estado === 'En Curso') {
          estadoEvaluacion = 'En Curso';
        }
        
        return {
          ...col,
          estado_evaluacion: estadoEvaluacion
        };
      });
      
      this.loading = false;
    },
    error: (error: any) => {
      console.error('Error al cargar colaboradores:', error);
      this.colaboradores = [];
      this.loading = false;
    }
  });
}
  get colaboradoresFiltrados(): Colaborador[] {
    let resultado = [...this.colaboradores];

    if (this.filtroEstado !== 'todos') {
      resultado = resultado.filter(col => col.estado_evaluacion === this.filtroEstado);
    }

    if (this.busqueda.trim()) {
      const busquedaLower = this.busqueda.toLowerCase();
      resultado = resultado.filter(col => 
        col.nombre.toLowerCase().includes(busquedaLower) ||
        col.apellido.toLowerCase().includes(busquedaLower) ||
        col.cargo.toLowerCase().includes(busquedaLower) ||
        col.area.toLowerCase().includes(busquedaLower)
      );
    }

    return resultado;
  }

  verDetalles(colaborador: Colaborador): void {
    this.router.navigate(['/manager/evaluaciones'], {
      queryParams: { userId: colaborador.id_usuario, modo: 'ver' }
    });
  }

  evaluarColaborador(colaborador: Colaborador): void {
    this.router.navigate(['/manager/evaluaciones'], {
      queryParams: { userId: colaborador.id_usuario }
    });
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
}