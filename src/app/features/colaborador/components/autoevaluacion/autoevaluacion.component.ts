import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EvaluacionesService, Evaluacion, EvaluacionPendiente, RespuestaEvaluacion } from '../../services/evaluaciones.service';
import { AuthService } from '@core/services/auth.service';

interface Pregunta {
  id: number;
  texto: string;
  tipo: 'escala' | 'texto' | 'multiple';
  categoria: string;
  opciones?: { valor: number; etiqueta: string }[];
}

@Component({
  selector: 'app-autoevaluacion',
  templateUrl: './autoevaluacion.component.html',
  styleUrls: ['./autoevaluacion.component.scss']
})
export class AutoevaluacionComponent implements OnInit {
  // Estados
  loading: boolean = true;
  guardando: boolean = false;
  evaluacionIniciada: boolean = false;
  
  // Datos
  evaluacionPendiente: EvaluacionPendiente | null = null;
  evaluacionActual: Evaluacion | null = null;
  preguntas: Pregunta[] = [];
  
  // Formulario
  evaluacionForm: FormGroup;
  
  // Progreso
  progresoActual: number = 0;
  preguntaActualIndex: number = 0;
  
  // Usuario
  userName: string = '';

  constructor(
    private evaluacionesService: EvaluacionesService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.evaluacionForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadEvaluacionPendiente();
  }

  loadUserInfo(): void {
    const user = this.authService.getCurrentUserFromStorage();
    if (user) {
      this.userName = user.nombre || user.email.split('@')[0];
    }
  }

  loadEvaluacionPendiente(): void {
    this.loading = true;
    this.evaluacionesService.getEvaluacionesPendientes().subscribe({
      next: (pendientes) => {
        if (pendientes && pendientes.length > 0) {
          this.evaluacionPendiente = pendientes[0];
          this.cargarPreguntasFormulario();
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar evaluación pendiente:', error);
        this.loading = false;
      }
    });
  }

  cargarPreguntasFormulario(): void {
    // Preguntas de ejemplo basadas en el formulario
    this.preguntas = [
      {
        id: 1,
        texto: '¿Cumples con los estándares de calidad establecidos en tus entregables?',
        tipo: 'escala',
        categoria: 'Calidad del Trabajo',
        opciones: [
          { valor: 1, etiqueta: '1' },
          { valor: 2, etiqueta: '2' },
          { valor: 3, etiqueta: '3' },
          { valor: 4, etiqueta: '4' },
          { valor: 5, etiqueta: '5' }
        ]
      },
      {
        id: 2,
        texto: '¿Colaboras efectivamente con tus compañeros de equipo?',
        tipo: 'escala',
        categoria: 'Trabajo en Equipo',
        opciones: [
          { valor: 1, etiqueta: '1' },
          { valor: 2, etiqueta: '2' },
          { valor: 3, etiqueta: '3' },
          { valor: 4, etiqueta: '4' },
          { valor: 5, etiqueta: '5' }
        ]
      },
      {
        id: 3,
        texto: '¿Tomas iniciativa para resolver problemas?',
        tipo: 'escala',
        categoria: 'Iniciativa',
        opciones: [
          { valor: 1, etiqueta: '1' },
          { valor: 2, etiqueta: '2' },
          { valor: 3, etiqueta: '3' },
          { valor: 4, etiqueta: '4' },
          { valor: 5, etiqueta: '5' }
        ]
      },
      {
        id: 4,
        texto: '¿Entregas tus tareas en los tiempos establecidos?',
        tipo: 'escala',
        categoria: 'Cumplimiento de Plazos',
        opciones: [
          { valor: 1, etiqueta: '1' },
          { valor: 2, etiqueta: '2' },
          { valor: 3, etiqueta: '3' },
          { valor: 4, etiqueta: '4' },
          { valor: 5, etiqueta: '5' }
        ]
      },
      {
        id: 5,
        texto: '¿Te mantienes actualizado con nuevas tecnologías y mejores prácticas?',
        tipo: 'escala',
        categoria: 'Aprendizaje Continuo',
        opciones: [
          { valor: 1, etiqueta: '1' },
          { valor: 2, etiqueta: '2' },
          { valor: 3, etiqueta: '3' },
          { valor: 4, etiqueta: '4' },
          { valor: 5, etiqueta: '5' }
        ]
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

  iniciarEvaluacion(): void {
    if (!this.evaluacionPendiente) return;

    this.guardando = true;
    
    const data = {
      formulario_id: this.evaluacionPendiente.id,
      tipo: this.evaluacionPendiente.tipo,
      periodo: new Date().getFullYear().toString(),
      fecha_inicio: new Date().toISOString(),
      fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.evaluacionesService.iniciarEvaluacion(data).subscribe({
      next: (evaluacion) => {
        this.evaluacionActual = evaluacion;
        this.evaluacionIniciada = true;
        this.guardando = false;
      },
      error: (error: any) => {
        console.error('Error al iniciar evaluación:', error);
        this.guardando = false;
      }
    });
  }

  responderPregunta(preguntaId: number, valor: number): void {
    this.evaluacionForm.patchValue({
      [`pregunta_${preguntaId}`]: valor
    });
    this.calcularProgreso();
  }

  calcularProgreso(): void {
    const totalPreguntas = this.preguntas.length;
    let respuestas = 0;

    this.preguntas.forEach(pregunta => {
      const valor = this.evaluacionForm.get(`pregunta_${pregunta.id}`)?.value;
      if (valor) respuestas++;
    });

    this.progresoActual = Math.round((respuestas / totalPreguntas) * 100);
  }

  guardarRespuestas(): void {
    if (!this.evaluacionActual || !this.evaluacionForm.valid) return;

    this.guardando = true;

    const respuestas: RespuestaEvaluacion[] = this.preguntas.map(pregunta => ({
      pregunta_id: pregunta.id,
      valor_respuesta: this.evaluacionForm.get(`pregunta_${pregunta.id}`)?.value,
      comentario: this.evaluacionForm.get(`comentario_${pregunta.id}`)?.value || undefined
    }));

    this.evaluacionesService.responderEvaluacion(this.evaluacionActual.id, respuestas).subscribe({
      next: () => {
        this.guardando = false;
        // Mostrar mensaje de éxito
      },
      error: (error: any) => {
        console.error('Error al guardar respuestas:', error);
        this.guardando = false;
      }
    });
  }

  enviarEvaluacion(): void {
    if (!this.evaluacionActual || !this.evaluacionForm.valid) return;

    this.guardando = true;

    // Primero guardar respuestas
    const respuestas: RespuestaEvaluacion[] = this.preguntas.map(pregunta => ({
      pregunta_id: pregunta.id,
      valor_respuesta: this.evaluacionForm.get(`pregunta_${pregunta.id}`)?.value,
      comentario: this.evaluacionForm.get(`comentario_${pregunta.id}`)?.value || undefined
    }));

    this.evaluacionesService.responderEvaluacion(this.evaluacionActual.id, respuestas).subscribe({
      next: () => {
        // Luego completar la evaluación
        this.evaluacionesService.completarEvaluacion(this.evaluacionActual!.id).subscribe({
          next: () => {
            this.guardando = false;
            this.router.navigate(['/colaborador/dashboard']);
          },
          error: (error: any) => {
            console.error('Error al completar evaluación:', error);
            this.guardando = false;
          }
        });
      },
      error: (error: any) => {
        console.error('Error al guardar respuestas:', error);
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/colaborador/dashboard']);
  }

  getPreguntasPorCategoria(categoria: string): Pregunta[] {
    return this.preguntas.filter(p => p.categoria === categoria);
  }

  getCategorias(): string[] {
    return [...new Set(this.preguntas.map(p => p.categoria))];
  }
}