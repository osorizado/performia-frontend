import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { EvaluacionesService } from '../../../colaborador/services/evaluaciones.service';
import { EquipoService } from '../../services/equipo.service';

interface Pregunta {
  id_pregunta: number;
  texto_pregunta: string;
  tipo_pregunta: string;
  competencia?: string;
  requerido: boolean;
}

interface Formulario {
  nombre_formulario: string;
  preguntas: Pregunta[];
}

interface Evaluacion {
  id_evaluacion: number;
  periodo: string;
  tipo_evaluacion: string;
  formulario: Formulario;
  usuario?: any;
}

@Component({
  selector: 'app-realizar-evaluacion',
  templateUrl: './realizar-evaluacion.component.html',
  styleUrls: ['./realizar-evaluacion.component.scss']
})
export class RealizarEvaluacionComponent implements OnInit {
  evaluacionId: number = 0;
  evaluacion: Evaluacion | null = null;
  formulario: Formulario | null = null;
  colaborador: any = null;
  loading: boolean = true;
  guardando: boolean = false;
  evaluacionForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private evaluacionesService: EvaluacionesService,
    private equipoService: EquipoService
  ) {}

  ngOnInit(): void {
    this.evaluacionId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.evaluacionId) {
      this.router.navigate(['/manager/evaluaciones']);
      return;
    }
    this.cargarEvaluacion();
  }

  cargarEvaluacion(): void {
    this.loading = true;
    
    this.evaluacionesService.getEvaluacion(this.evaluacionId).subscribe({
      next: (evaluacion: any) => {
        console.log('Evaluación cargada:', evaluacion);
        this.evaluacion = evaluacion;
        this.formulario = evaluacion.formulario;
        
        // Cargar información del colaborador si existe
        if (evaluacion.usuario?.id_usuario) {
          this.cargarColaborador(evaluacion.usuario.id_usuario);
        }
        
        this.construirFormulario();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar evaluación:', error);
        this.loading = false;
        alert('Error al cargar la evaluación');
        this.router.navigate(['/manager/evaluaciones']);
      }
    });
  }

  cargarColaborador(userId: number): void {
    this.equipoService.getColaborador(userId).subscribe({
      next: (colaborador: any) => {
        console.log('Colaborador cargado:', colaborador);
        this.colaborador = colaborador;
      },
      error: (error: any) => {
        console.error('Error al cargar colaborador:', error);
      }
    });
  }

  construirFormulario(): void {
    const formControls: any = {};
    
    if (this.formulario?.preguntas && this.formulario.preguntas.length > 0) {
      this.formulario.preguntas.forEach((pregunta: Pregunta) => {
        const validators = pregunta.requerido ? [Validators.required] : [];
        formControls[`pregunta_${pregunta.id_pregunta}`] = new FormControl('', validators);
        formControls[`comentario_${pregunta.id_pregunta}`] = new FormControl('');
      });
    }
    
    formControls['observaciones_generales'] = new FormControl('');
    
    this.evaluacionForm = this.fb.group(formControls);
  }

  responderPregunta(preguntaId: number, valor: number): void {
    this.evaluacionForm.patchValue({
      [`pregunta_${preguntaId}`]: valor
    });
  }

  onSubmit(): void {
    if (this.evaluacionForm.invalid) {
      alert('Por favor completa todas las preguntas requeridas');
      return;
    }

    if (!confirm('¿Estás seguro de enviar la evaluación? No podrás modificarla después.')) {
      return;
    }

    this.guardando = true;

    if (!this.formulario?.preguntas || this.formulario.preguntas.length === 0) {
      alert('Error: No se encontraron preguntas en el formulario');
      this.guardando = false;
      return;
    }

    const respuestas = this.formulario.preguntas.map((pregunta: Pregunta) => ({
      id_pregunta: pregunta.id_pregunta,
      respuesta: this.evaluacionForm.get(`pregunta_${pregunta.id_pregunta}`)?.value?.toString() || '',
      puntaje: this.getPuntaje(pregunta, this.evaluacionForm.get(`pregunta_${pregunta.id_pregunta}`)?.value),
      comentario: this.evaluacionForm.get(`comentario_${pregunta.id_pregunta}`)?.value || ''
    }));

    this.evaluacionesService.responderEvaluacion(this.evaluacionId, respuestas).subscribe({
      next: () => {
        this.evaluacionesService.completarEvaluacion(this.evaluacionId).subscribe({
          next: () => {
            this.guardando = false;
            alert('Evaluación completada exitosamente');
            this.router.navigate(['/manager/evaluaciones']);
          },
          error: (error: any) => {
            console.error('Error al completar evaluación:', error);
            this.guardando = false;
            alert('Error al completar la evaluación');
          }
        });
      },
      error: (error: any) => {
        console.error('Error al guardar respuestas:', error);
        this.guardando = false;
        alert('Error al guardar las respuestas');
      }
    });
  }

  getPuntaje(pregunta: Pregunta, respuesta: any): number {
    if (pregunta.tipo_pregunta === 'escala') {
      return Number(respuesta) || 0;
    }
    return 0;
  }

  cancelar(): void {
    if (confirm('¿Estás seguro de cancelar? Se perderán los cambios no guardados.')) {
      this.router.navigate(['/manager/evaluaciones']);
    }
  }

  getCategorias(): string[] {
    if (!this.formulario?.preguntas) return [];
    const categorias = this.formulario.preguntas
      .map((p: Pregunta) => p.competencia)
      .filter((c: string | undefined): c is string => !!c);
    return [...new Set(categorias)];
  }

  getPreguntasPorCategoria(categoria: string): Pregunta[] {
    if (!this.formulario?.preguntas) return [];
    return this.formulario.preguntas.filter((p: Pregunta) => p.competencia === categoria);
  }

  todasLasPreguntas(): Pregunta[] {
    return this.formulario?.preguntas || [];
  }

  tienePreguntas(): boolean {
    return this.formulario?.preguntas && this.formulario.preguntas.length > 0 || false;
  }
}