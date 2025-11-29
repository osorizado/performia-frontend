import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EvaluacionesService } from '../../services/evaluaciones.service';
import { AuthService } from '@core/services/auth.service';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';

interface Pregunta {
  id_pregunta: number;
  texto_pregunta: string;
  tipo_pregunta: string;
  competencia: string;
  peso: number;
  requerido: boolean;
  orden: number;
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
  evaluacionPendiente: any = null;
  evaluacionActual: any = null;
  preguntas: Pregunta[] = [];
  
  // Formulario
  evaluacionForm: FormGroup;
  
  // Progreso
  progresoActual: number = 0;
  
  // Usuario
  userName: string = '';

  private apiUrl = environment.apiUrl;

  constructor(
    private evaluacionesService: EvaluacionesService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient
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
      next: (response: any) => {
        console.log('📋 Respuesta completa de evaluaciones pendientes:', response);
        
        if (response && response.length > 0) {
          const evaluacion = response[0];
          console.log('✅ Evaluación encontrada:', evaluacion);
          console.log('📝 ID Formulario:', evaluacion.id_formulario);
          console.log('📄 Datos del formulario:', evaluacion.formulario);
          
          this.evaluacionPendiente = {
            id_evaluacion: evaluacion.id_evaluacion,
            id_formulario: evaluacion.id_formulario,
            id_evaluado: evaluacion.id_evaluado,
            id_evaluador: evaluacion.id_evaluador,
            tipo: evaluacion.tipo_evaluacion,
            periodo: evaluacion.periodo,
            fecha_limite: evaluacion.fecha_fin,
            titulo: evaluacion.formulario?.nombre_formulario || 'Sin título',
            descripcion: evaluacion.formulario?.descripcion || 'Sin descripción'
          };

          // Verificación antes de cargar preguntas
          if (this.evaluacionPendiente.id_formulario) {
            console.log('🔄 Cargando preguntas para formulario ID:', this.evaluacionPendiente.id_formulario);
            this.cargarPreguntasDesdeBackend(this.evaluacionPendiente.id_formulario);
          } else {
            console.error('❌ ERROR: id_formulario es undefined');
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo obtener el ID del formulario'
            });
          }
        } else {
          console.log('ℹ️ No hay evaluaciones pendientes');
          Swal.fire({
            icon: 'info',
            title: 'Sin evaluaciones',
            text: 'No tienes evaluaciones pendientes en este momento.'
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar evaluación pendiente:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar la evaluación pendiente'
        });
        this.loading = false;
      }
    });
  }

  cargarPreguntasDesdeBackend(formularioId: number): void {
    console.log('🔍 cargarPreguntasDesdeBackend llamado con ID:', formularioId);
    console.log('🔍 Tipo de formularioId:', typeof formularioId);
    
    if (!formularioId || formularioId === undefined) {
      console.error('❌ formularioId es inválido:', formularioId);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'ID de formulario inválido'
      });
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const url = `${environment.apiUrl}/formularios/${formularioId}/preguntas`;
    console.log('🌐 URL de petición:', url);

    this.http.get<any[]>(url, { headers }).subscribe({
      next: (preguntas: any[]) => {
        console.log('✅ Preguntas recibidas del backend:', preguntas);
        
        if (preguntas && preguntas.length > 0) {
          this.preguntas = preguntas.map((p: any) => ({
            id_pregunta: p.id_pregunta,
            texto_pregunta: p.texto_pregunta,
            tipo_pregunta: p.tipo_pregunta,
            competencia: p.competencia,
            peso: p.peso,
            requerido: p.requerido,
            orden: p.orden
          }));

          // Crear FormControls dinámicamente
          this.preguntas.forEach(pregunta => {
            const validators = pregunta.requerido ? [Validators.required] : [];
            this.evaluacionForm.addControl(
              `pregunta_${pregunta.id_pregunta}`,
              this.fb.control('', validators)
            );
            this.evaluacionForm.addControl(
              `comentario_${pregunta.id_pregunta}`,
              this.fb.control('')
            );
          });

          console.log('✅ Preguntas cargadas:', this.preguntas.length);
          console.log('✅ FormControls creados:', Object.keys(this.evaluacionForm.controls));
        } else {
          console.warn('⚠️ No hay preguntas en este formulario');
          Swal.fire({
            icon: 'warning',
            title: 'Sin preguntas',
            text: 'Este formulario no tiene preguntas configuradas'
          });
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar preguntas:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar las preguntas del formulario'
        });
      }
    });
  }

  iniciarEvaluacion(): void {
    if (!this.evaluacionPendiente) {
      console.error('❌ No hay evaluación pendiente');
      return;
    }

    console.log('✅ Activando evaluación localmente');
    
    this.evaluacionActual = {
      id: this.evaluacionPendiente.id_evaluacion,
      id_formulario: this.evaluacionPendiente.id_formulario,
      id_evaluado: this.evaluacionPendiente.id_evaluado,
      id_evaluador: this.evaluacionPendiente.id_evaluador,
      tipo: this.evaluacionPendiente.tipo,
      periodo: this.evaluacionPendiente.periodo,
      estado: 'En Curso'
    };
    
    this.evaluacionIniciada = true;
  }

  responderPregunta(preguntaId: number, valor: number): void {
    this.evaluacionForm.patchValue({
      [`pregunta_${preguntaId}`]: valor
    });
    this.calcularProgreso();
    
    // 🔍 DEBUG: Ver estado de validación
    console.log('📊 Estado del formulario después de responder:');
    console.log('   - Válido:', this.evaluacionForm.valid);
    console.log('   - Inválido:', this.evaluacionForm.invalid);
    console.log('   - Errores:', this.evaluacionForm.errors);
    
    // Ver estado de cada pregunta
    this.preguntas.forEach(p => {
      const control = this.evaluacionForm.get(`pregunta_${p.id_pregunta}`);
      if (control && control.invalid) {
        console.log(`   - Pregunta ${p.id_pregunta} inválida:`, control.errors);
      }
    });
  }

  calcularProgreso(): void {
    const totalPreguntas = this.preguntas.length;
    let respuestas = 0;

    this.preguntas.forEach(pregunta => {
      const valor = this.evaluacionForm.get(`pregunta_${pregunta.id_pregunta}`)?.value;
      
      // Contar como respondida si tiene valor válido
      if (pregunta.tipo_pregunta === 'Escala') {
        if (valor && typeof valor === 'number') respuestas++;
      } else if (pregunta.tipo_pregunta === 'Texto') {
        if (valor && valor.toString().trim() !== '') respuestas++;
      }
    });

    this.progresoActual = Math.round((respuestas / totalPreguntas) * 100);
    console.log(`📊 Progreso: ${respuestas}/${totalPreguntas} = ${this.progresoActual}%`);
  }

  /**
   * Verifica si todas las preguntas REQUERIDAS tienen respuesta
   */
  todasLasPreguntasRequeridas(): boolean {
    let todasRespondidas = true;
    
    this.preguntas.forEach(pregunta => {
      if (pregunta.requerido) {
        const control = this.evaluacionForm.get(`pregunta_${pregunta.id_pregunta}`);
        const valor = control?.value;
        
        // Validar según el tipo de pregunta
        if (pregunta.tipo_pregunta === 'Escala') {
          // Para escalas, debe ser un número válido (1-5)
          if (!valor || typeof valor !== 'number') {
            todasRespondidas = false;
            console.log(`⚠️ Pregunta ${pregunta.id_pregunta} (Escala) requerida sin respuesta`);
          }
        } else if (pregunta.tipo_pregunta === 'Texto') {
          // Para texto, debe tener contenido no vacío
          if (!valor || valor.toString().trim() === '') {
            todasRespondidas = false;
            console.log(`⚠️ Pregunta ${pregunta.id_pregunta} (Texto) requerida sin respuesta`);
          }
        }
      }
    });
    
    console.log('🎯 Todas las preguntas requeridas respondidas:', todasRespondidas);
    return todasRespondidas;
  }

  guardarRespuestas(): void {
    if (!this.evaluacionActual) {
      console.warn('⚠️ No hay evaluación actual');
      return;
    }

    if (!this.evaluacionForm.valid) {
      console.warn('⚠️ Formulario no válido');
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Por favor responde todas las preguntas obligatorias'
      });
      return;
    }

    this.guardando = true;

    const respuestas: any[] = this.preguntas.map(pregunta => ({
      id_pregunta: pregunta.id_pregunta,
      respuesta: this.evaluacionForm.get(`pregunta_${pregunta.id_pregunta}`)?.value?.toString(),
      puntaje: parseFloat(this.evaluacionForm.get(`pregunta_${pregunta.id_pregunta}`)?.value),
      comentario: this.evaluacionForm.get(`comentario_${pregunta.id_pregunta}`)?.value || ''
    }));

    console.log('📤 Guardando respuestas:', { evaluacion_id: this.evaluacionActual.id, respuestas });

    this.evaluacionesService.responderEvaluacion(this.evaluacionActual.id, respuestas).subscribe({
      next: (response) => {
        console.log('✅ Respuestas guardadas:', response);
        this.guardando = false;
        Swal.fire({
          icon: 'success',
          title: 'Guardado',
          text: 'Progreso guardado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error: any) => {
        console.error('❌ Error al guardar respuestas:', error);
        this.guardando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.detail || 'Error al guardar las respuestas'
        });
      }
    });
  }

  enviarEvaluacion(): void {
    if (!this.evaluacionActual || !this.evaluacionForm.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Por favor responde todas las preguntas obligatorias'
      });
      return;
    }

    Swal.fire({
      title: '¿Enviar evaluación?',
      text: 'No podrás modificarla después',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guardando = true;

        const respuestas: any[] = this.preguntas.map(pregunta => ({
          id_pregunta: pregunta.id_pregunta,
          respuesta: this.evaluacionForm.get(`pregunta_${pregunta.id_pregunta}`)?.value?.toString(),
          puntaje: parseFloat(this.evaluacionForm.get(`pregunta_${pregunta.id_pregunta}`)?.value),
          comentario: this.evaluacionForm.get(`comentario_${pregunta.id_pregunta}`)?.value || ''
        }));

        console.log('📤 Enviando evaluación completa:', { evaluacion_id: this.evaluacionActual.id, respuestas });

        this.evaluacionesService.responderEvaluacion(this.evaluacionActual.id, respuestas).subscribe({
          next: () => {
            console.log('✅ Respuestas guardadas, completando...');
            
            this.evaluacionesService.completarEvaluacion(this.evaluacionActual.id).subscribe({
              next: (response) => {
                console.log('✅ Evaluación completada:', response);
                this.guardando = false;
                Swal.fire({
                  icon: 'success',
                  title: '¡Enviado!',
                  text: 'Evaluación enviada exitosamente'
                }).then(() => {
                  this.router.navigate(['/colaborador/dashboard']);
                });
              },
              error: (error: any) => {
                console.error('❌ Error al completar:', error);
                this.guardando = false;
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: error.error?.detail || 'Error al completar la evaluación'
                });
              }
            });
          },
          error: (error: any) => {
            console.error('❌ Error al guardar:', error);
            this.guardando = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.detail || 'Error al guardar las respuestas'
            });
          }
        });
      }
    });
  }

  cancelar(): void {
    if (this.evaluacionIniciada) {
      Swal.fire({
        title: '¿Cancelar evaluación?',
        text: 'Se perderá el progreso no guardado',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Continuar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/colaborador/dashboard']);
        }
      });
    } else {
      this.router.navigate(['/colaborador/dashboard']);
    }
  }

  getPreguntasPorCategoria(categoria: string): Pregunta[] {
    return this.preguntas.filter(p => p.competencia === categoria);
  }

  getCategorias(): string[] {
    return [...new Set(this.preguntas.map(p => p.competencia))];
  }

  getOpciones(pregunta: Pregunta): { valor: number; etiqueta: string }[] {
    if (pregunta.tipo_pregunta === 'Escala') {
      return [
        { valor: 1, etiqueta: '1' },
        { valor: 2, etiqueta: '2' },
        { valor: 3, etiqueta: '3' },
        { valor: 4, etiqueta: '4' },
        { valor: 5, etiqueta: '5' }
      ];
    }
    return [];
  }
}