import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EvaluacionesService, RespuestaEvaluacion } from '../../../colaborador/services/evaluaciones.service';
import { EquipoService, Colaborador } from '../../services/equipo.service';

interface PreguntaEvaluacion {
  id: number;
  categoria: string;
  texto: string;
  tipo: 'escala' | 'texto';
}

@Component({
  selector: 'app-evaluar-colaborador',
  templateUrl: './evaluar-colaborador.component.html',
  styleUrls: ['./evaluar-colaborador.component.scss']
})
export class EvaluarColaboradorComponent implements OnInit {
  // Colaborador a evaluar
  colaborador: Colaborador | null = null;
  colaboradorId: number | null = null;
  
  // Formulario de evaluación
  evaluacionForm: FormGroup;
  
  // Preguntas de evaluación
  preguntas: PreguntaEvaluacion[] = [];
  
  // Estados
  loading: boolean = true;
  guardando: boolean = false;

  constructor(
    private evaluacionesService: EvaluacionesService,
    private equipoService: EquipoService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.evaluacionForm = this.fb.group({
      observaciones_generales: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['userId']) {
        this.colaboradorId = parseInt(params['userId']);
        this.loadColaborador(this.colaboradorId);
        this.loadPreguntas();
      } else {
        this.loading = false;
        // Redirigir a mi-equipo si no hay userId
        this.router.navigate(['/manager/mi-equipo']);
      }
    });
  }

  loadColaborador(userId: number): void {
    this.loading = true;
    
    // Llamada real al backend
    this.equipoService.getColaborador(userId).subscribe({
      next: (colaborador) => {
        this.colaborador = colaborador;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar colaborador:', error);
        this.loading = false;
        // Redirigir si hay error
        this.router.navigate(['/manager/mi-equipo']);
      }
    });
  }

  loadPreguntas(): void {
    // Preguntas predefinidas para evaluación del manager
    // TODO: En el futuro, estas preguntas deberían venir del backend según el formulario asignado
    this.preguntas = [
      {
        id: 1,
        categoria: 'Calidad del Trabajo',
        texto: '¿Cumple con los estándares de calidad establecidos en sus entregables?',
        tipo: 'escala'
      },
      {
        id: 2,
        categoria: 'Trabajo en Equipo',
        texto: '¿Colabora efectivamente con sus compañeros de equipo?',
        tipo: 'escala'
      },
      {
        id: 3,
        categoria: 'Iniciativa',
        texto: '¿Toma iniciativa para resolver problemas?',
        tipo: 'escala'
      },
      {
        id: 4,
        categoria: 'Cumplimiento de Plazos',
        texto: '¿Entrega sus tareas en los tiempos establecidos?',
        tipo: 'escala'
      },
      {
        id: 5,
        categoria: 'Aprendizaje Continuo',
        texto: '¿Se mantiene actualizado con nuevas tecnologías y mejores prácticas?',
        tipo: 'escala'
      },
      {
        id: 6,
        categoria: 'Comunicación',
        texto: '¿Comunica sus ideas de manera clara y efectiva?',
        tipo: 'escala'
      },
      {
        id: 7,
        categoria: 'Liderazgo',
        texto: '¿Muestra capacidad de liderazgo cuando es necesario?',
        tipo: 'escala'
      },
      {
        id: 8,
        categoria: 'Adaptabilidad',
        texto: '¿Se adapta bien a los cambios y nuevos desafíos?',
        tipo: 'escala'
      }
    ];

    // Crear controles del formulario para cada pregunta
    this.preguntas.forEach(pregunta => {
      this.evaluacionForm.addControl(
        `pregunta_${pregunta.id}`,
        this.fb.control('', Validators.required)
      );
      this.evaluacionForm.addControl(
        `comentario_${pregunta.id}`,
        this.fb.control('')
      );
    });
  }

  responderPregunta(preguntaId: number, valor: number): void {
    this.evaluacionForm.patchValue({
      [`pregunta_${preguntaId}`]: valor
    });
  }

  enviarEvaluacion(): void {
    if (!this.evaluacionForm.valid || !this.colaboradorId) {
      alert('Por favor completa todas las preguntas requeridas');
      return;
    }

    if (!confirm('¿Estás seguro de enviar la evaluación? No podrás modificarla después.')) {
      return;
    }

    this.guardando = true;

    // Preparar respuestas
    const respuestas: RespuestaEvaluacion[] = this.preguntas.map(pregunta => ({
      pregunta_id: pregunta.id,
      valor_respuesta: this.evaluacionForm.get(`pregunta_${pregunta.id}`)?.value,
      comentario: this.evaluacionForm.get(`comentario_${pregunta.id}`)?.value || undefined
    }));

    // TODO: Implementar la lógica completa de envío al backend
    // 1. Crear/obtener evaluación para el colaborador
    // 2. Enviar respuestas
    // 3. Completar evaluación
    
    // Por ahora, simulamos el envío
    console.log('Enviando evaluación:', {
      colaborador_id: this.colaboradorId,
      respuestas: respuestas,
      observaciones_generales: this.evaluacionForm.get('observaciones_generales')?.value
    });

    // Simular llamada al backend
    setTimeout(() => {
      this.guardando = false;
      alert('Evaluación enviada exitosamente');
      this.router.navigate(['/manager/evaluaciones']);
    }, 1500);

    /* IMPLEMENTACIÓN REAL (cuando el backend esté listo):
    
    // Primero iniciar evaluación para el colaborador
    const dataEvaluacion = {
      formulario_id: 1, // ID del formulario de evaluación
      tipo: 'evaluacion_manager',
      periodo: new Date().getFullYear().toString(),
      fecha_inicio: new Date().toISOString(),
      fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      user_id: this.colaboradorId
    };

    this.evaluacionesService.iniciarEvaluacion(dataEvaluacion).subscribe({
      next: (evaluacion) => {
        // Enviar respuestas
        this.evaluacionesService.responderEvaluacion(evaluacion.id, respuestas).subscribe({
          next: () => {
            // Completar evaluación
            this.evaluacionesService.completarEvaluacion(evaluacion.id).subscribe({
              next: () => {
                this.guardando = false;
                alert('Evaluación enviada exitosamente');
                this.router.navigate(['/manager/evaluaciones']);
              },
              error: (error) => {
                console.error('Error al completar evaluación:', error);
                this.guardando = false;
                alert('Error al completar la evaluación');
              }
            });
          },
          error: (error) => {
            console.error('Error al enviar respuestas:', error);
            this.guardando = false;
            alert('Error al enviar las respuestas');
          }
        });
      },
      error: (error) => {
        console.error('Error al iniciar evaluación:', error);
        this.guardando = false;
        alert('Error al iniciar la evaluación');
      }
    });
    */
  }

  cancelar(): void {
    if (confirm('¿Estás seguro de cancelar la evaluación? Los cambios no guardados se perderán.')) {
      this.router.navigate(['/manager/evaluaciones']);
    }
  }

  getCategorias(): string[] {
    return [...new Set(this.preguntas.map(p => p.categoria))];
  }

  getPreguntasPorCategoria(categoria: string): PreguntaEvaluacion[] {
    return this.preguntas.filter(p => p.categoria === categoria);
  }

  getAutoevaluacionValue(preguntaId: number): number {
    // TODO: Obtener la autoevaluación del colaborador desde el backend
    // Por ahora retornamos valores mock
    const autoevaluaciones: {[key: number]: number} = {
      1: 5,
      2: 4,
      3: 5,
      4: 4,
      5: 5,
      6: 4,
      7: 3,
      8: 5
    };
    return autoevaluaciones[preguntaId] || 0;
  }
}