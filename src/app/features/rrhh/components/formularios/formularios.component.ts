// ✅ VERSIÓN DEFINITIVA - TODOS LOS PROBLEMAS RESUELTOS
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

interface Pregunta {
  id_pregunta?: number;
  texto_pregunta: string;
  competencia: string;
  tipo_pregunta: 'escala' | 'texto';
  peso?: number;
  orden?: number;
  requerido?: boolean;
}

interface Formulario {
  id_formulario: number;
  nombre_formulario: string;
  descripcion: string;
  tipo_formulario: string;
  periodo: string;
  rol_aplicable: number;
  estado: string;
  preguntas: Pregunta[];
  fecha_creacion?: string;
}

interface Rol {
  id_rol: number;
  nombre_rol: string;
  descripcion: string;
}

@Component({
  selector: 'app-formularios',
  templateUrl: './formularios.component.html',
  styleUrls: ['./formularios.component.scss']
})
export class FormulariosComponent implements OnInit {
  tituloFormulario: string = '';
  descripcionFormulario: string = '';
  rolAplicableSeleccionado: number = 4;
  preguntas: Pregunta[] = [];
  formularios: Formulario[] = [];
  
  rolesDisponibles: Rol[] = [
    { id_rol: 3, nombre_rol: 'Manager', descripcion: 'Líderes de equipo' },
    { id_rol: 4, nombre_rol: 'Colaborador', descripcion: 'Personal técnico/operativo' },
    { id_rol: 5, nombre_rol: 'Director', descripcion: 'Nivel directivo' }
  ];

  modoCreacion: boolean = false;
  modoEdicion: boolean = false;
  formularioIdEdicion: number | null = null;
  guardando: boolean = false;
  loading: boolean = false;

  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarFormularios();
  }

  nuevoFormulario(): void {
    this.modoCreacion = true;
    this.modoEdicion = false;
    this.formularioIdEdicion = null;
    this.limpiarFormulario();
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
    this.modoCreacion = false;
    this.modoEdicion = false;
    this.formularioIdEdicion = null;
  }

  agregarPregunta(): void {
    this.preguntas.push({
      texto_pregunta: '',
      competencia: 'Calidad del trabajo',
      tipo_pregunta: 'escala',
      peso: 1,
      orden: this.preguntas.length + 1,
      requerido: true
    });
  }

  eliminarPregunta(index: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.preguntas.splice(index, 1);
        this.preguntas.forEach((p, i) => p.orden = i + 1);
        
        Swal.fire({
          title: 'Eliminada',
          text: 'La pregunta ha sido eliminada',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  guardarFormulario(): void {
    if (!this.tituloFormulario || this.preguntas.length === 0) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor completa el título y agrega al menos una pregunta',
        icon: 'warning',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const preguntasIncompletas = this.preguntas.filter(p => !p.texto_pregunta || !p.competencia);
    if (preguntasIncompletas.length > 0) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor completa todas las preguntas antes de guardar',
        icon: 'warning',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    this.guardando = true;

    if (this.modoEdicion && this.formularioIdEdicion) {
      this.modificarFormulario();
    } else {
      this.crearFormulario();
    }
  }

  private crearFormulario(): void {
    const preguntasFormateadas = this.preguntas.map((p, index) => ({
      texto_pregunta: p.texto_pregunta,
      tipo_pregunta: p.tipo_pregunta,
      competencia: p.competencia,
      peso: p.peso || 1,
      orden: index + 1,
      requerido: p.requerido !== false
    }));

    const formularioData = {
      nombre_formulario: this.tituloFormulario,
      descripcion: this.descripcionFormulario || '',
      tipo_formulario: 'evaluacion',
      periodo: new Date().getFullYear().toString(),
      rol_aplicable: this.rolAplicableSeleccionado,
      estado: 'Borrador',
      preguntas: preguntasFormateadas
    };

    console.log('📤 Creando formulario:', formularioData);

    this.http.post(`${this.apiUrl}/formularios/`, formularioData).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Formulario creado correctamente',
          icon: 'success',
          confirmButtonColor: '#28a745'
        });
        this.cancelarEdicion();
        this.cargarFormularios();
      },
      error: (error: any) => {
        console.error('❌ Error:', error);
        this.manejarError(error);
        this.guardando = false;
      }
    });
  }

  // ✅ CRÍTICO: Modificación con normalización del tipo_pregunta
  private modificarFormulario(): void {
    if (!this.formularioIdEdicion) return;

    // ✅ SOLUCIÓN: Normalizar explícitamente cada tipo_pregunta antes de enviar
    const preguntasFormateadas = this.preguntas.map((p, index) => {
      // Asegurar que tipo_pregunta sea exactamente 'escala' o 'texto'
      let tipoNormalizado: 'escala' | 'texto' = 'texto';
      if (p.tipo_pregunta) {
        const tipoLower = p.tipo_pregunta.toString().toLowerCase();
        tipoNormalizado = (tipoLower === 'escala' || tipoLower.includes('escala')) ? 'escala' : 'texto';
      }

      console.log(`📝 Pregunta ${index + 1}: tipo original="${p.tipo_pregunta}" → normalizado="${tipoNormalizado}"`);

      return {
        texto_pregunta: p.texto_pregunta,
        tipo_pregunta: tipoNormalizado,  // ✅ Usar el tipo normalizado
        competencia: p.competencia,
        peso: p.peso || 1,
        orden: index + 1,
        requerido: p.requerido !== false
      };
    });

    const formularioData = {
      nombre_formulario: this.tituloFormulario,
      descripcion: this.descripcionFormulario || '',
      tipo_formulario: 'evaluacion',
      periodo: new Date().getFullYear().toString(),
      rol_aplicable: this.rolAplicableSeleccionado,
      preguntas: preguntasFormateadas
    };

    console.log('📝 Modificando formulario ID:', this.formularioIdEdicion);
    console.log('📋 Datos a enviar:', JSON.stringify(formularioData, null, 2));

    this.http.put(
      `${this.apiUrl}/formularios/${this.formularioIdEdicion}`,
      formularioData
    ).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servidor:', response);
        Swal.fire({
          title: '¡Éxito!',
          text: 'Formulario modificado correctamente',
          icon: 'success',
          confirmButtonColor: '#28a745'
        });
        this.cancelarEdicion();
        this.cargarFormularios();
      },
      error: (error: any) => {
        console.error('❌ Error:', error);
        this.manejarError(error);
        this.guardando = false;
      }
    });
  }

  private manejarError(error: any): void {
    let errorMsg = 'Error al guardar el formulario';
    
    if (error.status === 401) {
      errorMsg = 'No estás autorizado.';
    } else if (error.error && error.error.detail) {
      if (Array.isArray(error.error.detail)) {
        errorMsg = error.error.detail.map((e: any) => e.msg).join(', ');
      } else {
        errorMsg = error.error.detail;
      }
    }
    
    Swal.fire({
      title: 'Error',
      text: errorMsg,
      icon: 'error',
      confirmButtonColor: '#d33'
    });
  }

  cargarFormularios(): void {
    this.loading = true;
    
    this.http.get<Formulario[]>(`${this.apiUrl}/formularios/`).subscribe({
      next: (data) => {
        this.formularios = data;
        this.loading = false;
        console.log('✅ Formularios cargados:', data);
      },
      error: (error) => {
        console.error('❌ Error al cargar formularios:', error);
        this.loading = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los formularios',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  // ✅ CRÍTICO: Edición con normalización correcta
  editarFormulario(formulario: Formulario): void {
    this.modoCreacion = true;
    this.modoEdicion = true;
    this.formularioIdEdicion = formulario.id_formulario;
    
    this.tituloFormulario = formulario.nombre_formulario;
    this.descripcionFormulario = formulario.descripcion || '';
    this.rolAplicableSeleccionado = formulario.rol_aplicable;
    
    // ✅ SOLUCIÓN: Normalizar tipo_pregunta al cargar
    this.preguntas = (formulario.preguntas || []).map(p => {
      let tipoPregunta: 'escala' | 'texto' = 'texto';
      if (p.tipo_pregunta) {
        const tipoLower = p.tipo_pregunta.toLowerCase();
        tipoPregunta = (tipoLower === 'escala' || tipoLower === 'escala_1_5') ? 'escala' : 'texto';
      }
      
      return {
        id_pregunta: p.id_pregunta,
        texto_pregunta: p.texto_pregunta,
        competencia: p.competencia || 'Calidad del trabajo',
        tipo_pregunta: tipoPregunta,
        peso: p.peso || 1,
        orden: p.orden || 0,
        requerido: p.requerido !== false
      };
    });

    console.log('✏️ Editando formulario - Preguntas cargadas:', this.preguntas);
  }

  duplicarFormulario(formulario: Formulario): void {
    Swal.fire({
      title: '¿Duplicar formulario?',
      text: 'Se creará una copia de este formulario',
      input: 'text',
      inputLabel: 'Nombre del nuevo formulario',
      inputValue: formulario.nombre_formulario + ' (Copia)',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Duplicar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return '¡Debes ingresar un nombre!';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.http.post(
          `${this.apiUrl}/formularios/${formulario.id_formulario}/duplicar`,
          null,
          { params: { nuevo_nombre: result.value } }
        ).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Duplicado!',
              text: 'El formulario ha sido duplicado',
              icon: 'success',
              confirmButtonColor: '#28a745'
            });
            this.cargarFormularios();
          },
          error: (error) => {
            this.manejarError(error);
          }
        });
      }
    });
  }

  eliminarFormulario(formulario: Formulario): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `El formulario "${formulario.nombre_formulario}" será archivado`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, archivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/formularios/${formulario.id_formulario}`).subscribe({
          next: (response: any) => {
            Swal.fire({
              title: 'Archivado',
              text: response.message || 'Formulario archivado correctamente',
              icon: 'success',
              confirmButtonColor: '#28a745'
            });
            this.cargarFormularios();
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: error.error?.detail || 'No se pudo archivar el formulario',
              icon: 'error',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }
toggleActivarFormulario(formulario: Formulario): void {
  const esActivo = formulario.estado === 'Activo';
  const nuevoEstado = esActivo ? 'Borrador' : 'Activo';
  
  Swal.fire({
    title: `¿${esActivo ? 'Cambiar a Borrador' : 'Activar'} formulario?`,
    html: `
      <p>Formulario: <strong>${formulario.nombre_formulario}</strong></p>
      <p>Estado actual: <strong>${formulario.estado}</strong></p>
      <p>Estado nuevo: <strong>${nuevoEstado}</strong></p>
      ${!esActivo ? '<p style="color: #28a745; margin-top: 10px;">✓ Al activar, el formulario estará disponible para evaluaciones</p>' : ''}
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: esActivo ? '#ffc107' : '#28a745',
    cancelButtonColor: '#6c757d',
    confirmButtonText: esActivo ? 'Cambiar a Borrador' : 'Activar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      if (esActivo) {
        // Cambiar a Borrador
        this.http.put(
          `${this.apiUrl}/formularios/${formulario.id_formulario}`,
          { estado: 'Borrador' }
        ).subscribe({
          next: () => {
            Swal.fire({
              title: 'Cambiado',
              text: 'El formulario ahora está en Borrador',
              icon: 'success',
              confirmButtonColor: '#28a745'
            });
            this.cargarFormularios();
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: error.error?.detail || 'No se pudo cambiar el estado',
              icon: 'error',
              confirmButtonColor: '#d33'
            });
          }
        });
      } else {
        // Activar
        this.http.post(
          `${this.apiUrl}/formularios/${formulario.id_formulario}/activar`,
          {}
        ).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Activado!',
              text: 'El formulario ahora está activo',
              icon: 'success',
              confirmButtonColor: '#28a745'
            });
            this.cargarFormularios();
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: error.error?.detail || 'No se pudo activar el formulario',
              icon: 'error',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    }
  });
}
  // ✅ Vista previa con normalización
  verVistaPrevia(formulario: Formulario): void {
    console.log('👁️ Vista previa de formulario:', formulario);
    
    const htmlContent = `
      <div style="text-align: left; max-height: 500px; overflow-y: auto;">
        <div style="margin-bottom: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${formulario.nombre_formulario}</h3>
          <p style="color: #666; margin: 5px 0;"><strong>Descripción:</strong> ${formulario.descripcion || 'Sin descripción'}</p>
          <p style="color: #666; margin: 5px 0;"><strong>Aplica a:</strong> ${this.getNombreRol(formulario.rol_aplicable)}</p>
          <p style="color: #666; margin: 5px 0;"><strong>Período:</strong> ${formulario.periodo}</p>
          <p style="color: #666; margin: 5px 0;">
            <strong>Estado:</strong> 
            <span style="padding: 3px 8px; border-radius: 4px; font-size: 12px; background: ${this.getEstadoColor(formulario.estado)}; color: white;">
              ${formulario.estado}
            </span>
          </p>
        </div>
        
        <div style="margin-top: 20px;">
          <h4 style="color: #2c3e50; margin-bottom: 15px;">Preguntas (${formulario.preguntas?.length || 0})</h4>
          ${(formulario.preguntas || []).length === 0 ? 
            '<p style="color: #999; text-align: center;">No hay preguntas</p>' :
            formulario.preguntas.map((p: Pregunta, index: number) => {
              const tipoLower = (p.tipo_pregunta || 'texto').toLowerCase();
              const esEscala = tipoLower === 'escala' || tipoLower === 'escala_1_5';
              
              return `
              <div style="margin-bottom: 20px; padding: 15px; background: white; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                  <span style="font-weight: bold; color: #3498db;">Pregunta ${index + 1}</span>
                  <span style="padding: 2px 8px; background: ${esEscala ? '#e3f2fd' : '#fff3e0'}; color: ${esEscala ? '#1976d2' : '#f57c00'}; border-radius: 4px; font-size: 11px;">
                    ${esEscala ? 'Escala 1-5' : 'Texto libre'}
                  </span>
                </div>
                <p style="margin: 8px 0; color: #2c3e50; font-size: 14px; font-weight: 500;">${p.texto_pregunta}</p>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f0f0f0;">
                  <span style="color: #888; font-size: 12px;">
                    <strong>Competencia:</strong> ${p.competencia || 'Sin especificar'}
                  </span>
                </div>
                
                ${esEscala ? `
                  <div style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px;">
                    <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; font-weight: 500;">Selecciona tu respuesta:</p>
                    <div style="display: flex; gap: 8px; justify-content: space-between;">
                      ${[1, 2, 3, 4, 5].map(num => `
                        <label style="display: flex; flex-direction: column; align-items: center; cursor: pointer; padding: 10px; background: white; border: 2px solid #e0e0e0; border-radius: 6px; flex: 1;">
                          <input type="radio" name="preview_q${index}" value="${num}" style="margin-bottom: 4px;" disabled>
                          <span style="font-weight: bold; color: #3498db; font-size: 18px;">${num}</span>
                        </label>
                      `).join('')}
                    </div>
                  </div>
                ` : `
                  <div style="margin-top: 12px;">
                    <textarea 
                      placeholder="Escribe tu respuesta aquí..." 
                      style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-family: inherit; resize: vertical; min-height: 80px;" 
                      disabled></textarea>
                  </div>
                `}
              </div>
            `}).join('')
          }
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Vista Previa del Formulario',
      html: htmlContent,
      width: '750px',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3085d6'
    });
  }

  private getEstadoColor(estado: string): string {
    switch(estado.toLowerCase()) {
      case 'activo':
        return '#28a745';
      case 'borrador':
        return '#ffc107';
      case 'archivado':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  }

  getEstadoBadgeClass(estado: string): string {
    switch(estado.toLowerCase()) {
      case 'activo':
        return 'badge-activo';
      case 'borrador':
        return 'badge-borrador';
      case 'archivado':
        return 'badge-archivado';
      default:
        return 'badge-default';
    }
  }

  private limpiarFormulario(): void {
    this.tituloFormulario = '';
    this.descripcionFormulario = '';
    this.rolAplicableSeleccionado = 4;
    this.preguntas = [];
    this.guardando = false;
  }

  getNombreRol(idRol: number): string {
    const rol = this.rolesDisponibles.find(r => r.id_rol === idRol);
    return rol ? rol.nombre_rol : 'Desconocido';
  }

  getCompetenciasUnicas(): string[] {
    const competencias = this.preguntas.map(p => p.competencia);
    return [...new Set(competencias)];
  }

  getFechaFormateada(fecha: string | undefined): string {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  asignarEvaluaciones(formulario: any): void {
  if (formulario.estado !== 'Activo') {
    Swal.fire({
      icon: 'warning',
      title: 'Formulario no activo',
      text: 'Solo puedes asignar evaluaciones de formularios activos',
      confirmButtonColor: '#4F46E5'
    });
    return;
  }

  Swal.fire({
    title: '¿Asignar evaluaciones?',
    html: `
      <div style="text-align: left; padding: 0 20px;">
        <p>Se creará una evaluación para todos los usuarios del rol:</p>
        <strong style="color: #4F46E5;">${this.getNombreRol(formulario.rol_aplicable)}</strong>
        <br><br>
        <div style="margin-bottom: 15px;">
          <label for="periodo-input" style="display: block; font-weight: 600; margin-bottom: 5px;">Período:</label>
          <input type="text" id="periodo-input" class="swal2-input" style="margin: 0; width: 100%;" placeholder="2025" value="${new Date().getFullYear()}">
        </div>
        <div>
          <label for="dias-input" style="display: block; font-weight: 600; margin-bottom: 5px;">Días de plazo:</label>
          <input type="number" id="dias-input" class="swal2-input" style="margin: 0; width: 100%;" placeholder="21" value="21" min="1" max="90">
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, asignar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#4F46E5',
    cancelButtonColor: '#6B7280',
    preConfirm: () => {
      const periodo = (document.getElementById('periodo-input') as HTMLInputElement).value;
      const dias = parseInt((document.getElementById('dias-input') as HTMLInputElement).value);
      
      if (!periodo || !dias || dias < 1) {
        Swal.showValidationMessage('Por favor completa todos los campos correctamente');
        return false;
      }
      
      return { periodo, dias };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      this.loading = true;

      const asignacion = {
        id_formulario: formulario.id_formulario,
        rol_id: formulario.rol_aplicable,
        periodo: result.value.periodo,
        tipo_evaluacion: 'Autoevaluación',
        dias_plazo: result.value.dias
      };

      this.http.post(`${this.apiUrl}/evaluaciones/asignar-masiva`, asignacion)
        .subscribe({
          next: (response: any) => {
            this.loading = false;
            
            const detalleHTML = `
              <div style="text-align: left; padding: 0 20px;">
                <p><strong>Formulario:</strong> ${response.formulario_nombre}</p>
                <p><strong>Período:</strong> ${response.periodo}</p>
                <p><strong>Evaluaciones creadas:</strong> ${response.evaluaciones_creadas.length}</p>
                ${response.evaluaciones_existentes.length > 0 ? 
                  `<p style="color: #F59E0B;"><strong>Ya existentes:</strong> ${response.evaluaciones_existentes.length}</p>` 
                  : ''}
                <p><strong>Fecha inicio:</strong> ${response.fecha_inicio}</p>
                <p><strong>Fecha fin:</strong> ${response.fecha_fin}</p>
              </div>
            `;
            
            Swal.fire({
              icon: 'success',
              title: '¡Evaluaciones asignadas!',
              html: detalleHTML,
              confirmButtonColor: '#4F46E5'
            });
          },
          error: (error) => {
            this.loading = false;
            console.error('Error al asignar evaluaciones:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.detail || 'No se pudieron asignar las evaluaciones',
              confirmButtonColor: '#4F46E5'
            });
          }
        });
    }
  });
}
}