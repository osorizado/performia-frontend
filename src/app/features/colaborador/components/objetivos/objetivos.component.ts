import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ObjetivosService, Objetivo, ObjetivoCreate } from '../../services/objetivos.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-objetivos',
  templateUrl: './objetivos.component.html',
  styleUrls: ['./objetivos.component.scss']
})
export class ObjetivosComponent implements OnInit {
  // Estados
  loading: boolean = true;
  guardando: boolean = false;
  mostrarModal: boolean = false;
  modoEdicion: boolean = false;
  
  // Datos
  objetivos: Objetivo[] = [];
  objetivoSeleccionado: Objetivo | null = null;
  
  // Formulario
  objetivoForm: FormGroup;
  
  // Filtros
  filtroEstado: string = 'todos';
  filtroPrioridad: string = 'todos';
  ordenamiento: string = 'fecha_inicio';
  
  // Usuario
  userName: string = '';

  constructor(
    private objetivosService: ObjetivosService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.objetivoForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      fecha_inicio: ['', Validators.required],
      fecha_fin: ['', Validators.required],
      prioridad: ['Media', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadObjetivos();
  }

  loadUserInfo(): void {
    const user = this.authService.getCurrentUserFromStorage();
    if (user) {
      this.userName = user.nombre || user.email.split('@')[0];
    }
  }

  loadObjetivos(): void {
    this.loading = true;
    this.objetivosService.getMisObjetivos().subscribe({
      next: (objetivos) => {
        this.objetivos = objetivos;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar objetivos:', error);
        this.loading = false;
      }
    });
  }

  get objetivosFiltrados(): Objetivo[] {
    let resultado = [...this.objetivos];

    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      resultado = resultado.filter(obj => obj.estado === this.filtroEstado);
    }

    // Filtrar por prioridad
    if (this.filtroPrioridad !== 'todos') {
      resultado = resultado.filter(obj => obj.prioridad === this.filtroPrioridad);
    }

    // Ordenar
    switch (this.ordenamiento) {
      case 'fecha_inicio':
        resultado.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());
        break;
      case 'fecha_fin':
        resultado.sort((a, b) => new Date(a.fecha_fin).getTime() - new Date(b.fecha_fin).getTime());
        break;
      case 'progreso':
        resultado.sort((a, b) => b.progreso - a.progreso);
        break;
      case 'prioridad':
        const prioridadOrden: { [key: string]: number } = { 'Alta': 1, 'Media': 2, 'Baja': 3 };
        resultado.sort((a, b) => prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad]);
        break;
    }

    return resultado;
  }

  get estadisticas() {
    const total = this.objetivos.length;
    const completados = this.objetivos.filter(obj => obj.estado === 'Completado').length;
    const enCurso = this.objetivos.filter(obj => obj.estado === 'En Curso').length;
    const enPausa = this.objetivos.filter(obj => obj.estado === 'En Pausa').length;
    const progresoPromedio = total > 0 
      ? Math.round(this.objetivos.reduce((sum, obj) => sum + obj.progreso, 0) / total)
      : 0;

    return { total, completados, enCurso, enPausa, progresoPromedio };
  }

  abrirModalNuevo(): void {
    this.modoEdicion = false;
    this.objetivoSeleccionado = null;
    this.objetivoForm.reset({
      prioridad: 'Media'
    });
    this.mostrarModal = true;
  }

  abrirModalEditar(objetivo: Objetivo): void {
    this.modoEdicion = true;
    this.objetivoSeleccionado = objetivo;
    
    this.objetivoForm.patchValue({
      titulo: objetivo.titulo,
      descripcion: objetivo.descripcion,
      fecha_inicio: this.formatDateForInput(objetivo.fecha_inicio),
      fecha_fin: this.formatDateForInput(objetivo.fecha_fin),
      prioridad: objetivo.prioridad
    });
    
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.objetivoForm.reset();
    this.objetivoSeleccionado = null;
  }

  guardarObjetivo(): void {
    if (!this.objetivoForm.valid) return;

    this.guardando = true;
    const formValue = this.objetivoForm.value;

    if (this.modoEdicion && this.objetivoSeleccionado) {
      // Actualizar objetivo existente
      this.objetivosService.actualizarObjetivo(this.objetivoSeleccionado.id, formValue).subscribe({
        next: (objetivoActualizado) => {
          const index = this.objetivos.findIndex(obj => obj.id === objetivoActualizado.id);
          if (index !== -1) {
            this.objetivos[index] = objetivoActualizado;
          }
          this.guardando = false;
          this.cerrarModal();
        },
        error: (error: any) => {
          console.error('Error al actualizar objetivo:', error);
          this.guardando = false;
        }
      });
    } else {
      // Crear nuevo objetivo
      const nuevoObjetivo: ObjetivoCreate = {
        titulo: formValue.titulo,
        descripcion: formValue.descripcion,
        fecha_inicio: formValue.fecha_inicio,
        fecha_fin: formValue.fecha_fin,
        prioridad: formValue.prioridad
      };

      this.objetivosService.crearObjetivo(nuevoObjetivo).subscribe({
        next: (objetivo) => {
          this.objetivos.unshift(objetivo);
          this.guardando = false;
          this.cerrarModal();
        },
        error: (error: any) => {
          console.error('Error al crear objetivo:', error);
          this.guardando = false;
        }
      });
    }
  }

  eliminarObjetivo(objetivo: Objetivo): void {
    if (!confirm(`¿Estás seguro de eliminar el objetivo "${objetivo.titulo}"?`)) {
      return;
    }

    this.objetivosService.eliminarObjetivo(objetivo.id).subscribe({
      next: () => {
        this.objetivos = this.objetivos.filter(obj => obj.id !== objetivo.id);
      },
      error: (error: any) => {
        console.error('Error al eliminar objetivo:', error);
      }
    });
  }

  actualizarProgreso(objetivo: Objetivo, nuevoProgreso: number): void {
    const progreso = Math.min(100, Math.max(0, nuevoProgreso));
    
    this.objetivosService.actualizarObjetivo(objetivo.id, { progreso }).subscribe({
      next: (objetivoActualizado) => {
        const index = this.objetivos.findIndex(obj => obj.id === objetivoActualizado.id);
        if (index !== -1) {
          this.objetivos[index] = objetivoActualizado;
        }
      },
      error: (error: any) => {
        console.error('Error al actualizar progreso:', error);
      }
    });
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'Completado':
        return 'badge-success';
      case 'En Curso':
        return 'badge-warning';
      case 'En Pausa':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  }

  getPrioridadClass(prioridad: string): string {
    switch (prioridad) {
      case 'Alta':
        return 'prioridad-alta';
      case 'Media':
        return 'prioridad-media';
      case 'Baja':
        return 'prioridad-baja';
      default:
        return '';
    }
  }

  getProgresoColor(progreso: number): string {
    if (progreso >= 90) return 'success';
    if (progreso >= 75) return 'info';
    if (progreso >= 60) return 'warning';
    return 'danger';
  }

  getDiasRestantes(fechaFin: string): number {
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diffTime = fin.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${date.getDate()} ${meses[date.getMonth()]} ${date.getFullYear()}`;
  }
}