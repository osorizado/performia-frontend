import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EvaluacionesService } from '../../../colaborador/services/evaluaciones.service';

interface EvaluacionDetalle {
  id_evaluacion: number;
  evaluado: {
    nombre: string;
    apellido: string;
    cargo: string;
    area: string;
  };
  formulario: {
    nombre_formulario: string;
  };
  tipo_evaluacion: string;
  periodo: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  puntaje_total?: number;
  observaciones_generales?: string;
  respuestas?: any[];
}

@Component({
  selector: 'app-evaluacion-detalle',
  templateUrl: './evaluacion-detalle.component.html',
  styleUrls: ['./evaluacion-detalle.component.scss']
})
export class EvaluacionDetalleComponent implements OnInit {
  evaluacionId: number = 0;
  evaluacion: EvaluacionDetalle | null = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionesService: EvaluacionesService
  ) {}

  ngOnInit(): void {
    this.evaluacionId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadEvaluacion();
  }

  loadEvaluacion(): void {
    this.loading = true;
    this.evaluacionesService.getEvaluacionById(this.evaluacionId).subscribe({
      next: (data) => {
        this.evaluacion = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar evaluación:', error);
        this.loading = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/manager/evaluaciones']);
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'Completada': return 'badge-success';
      case 'En Curso': return 'badge-warning';
      case 'Pendiente': return 'badge-danger';
      default: return 'badge-info';
    }
  }
}