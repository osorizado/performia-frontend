import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import Swal from 'sweetalert2';
import { environment } from '@environments/environment';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

// ========================================
// INTERFACES
// ========================================

interface EstadisticasGenerales {
  promedio_general: number;
  evaluaciones_completas: number;
  evaluaciones_pendientes: number;
  tasa_completitud: number;
  top_performers: number;
  total_colaboradores: number;
  total_evaluadores: number;
}

interface AreaRanking {
  area: string;
  promedio: number;
  total_colaboradores: number;
  evaluaciones_completas: number;
}

interface Colaborador {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  area?: string;
  puesto?: string;
}

interface EvaluacionAsignada {
  id_evaluacion: number;
  id_formulario: number;
  id_evaluado: number;
  id_evaluador: number;
  tipo_evaluacion: string;
  fecha_asignacion: string;
  fecha_limite?: string;
  estado: string;
  evaluado_nombre?: string;
  evaluador_nombre?: string;
}

interface ActividadReciente {
  usuario: string;
  accion: string;
  tiempo: string;
}

interface CompletitudArea {
  area: string;
  completadas: number;
  pendientes: number;
  total: number;
}

interface Estadisticas {
  total_colaboradores: number;
  evaluaciones_completadas: number;
  pendientes: number;
  promedio_global: number;
  sin_asignar: number;
}

// ========================================
// COMPONENTE
// ========================================

@Component({
  selector: 'app-panel-control',
  templateUrl: './panel-control.component.html',
  styleUrls: ['./panel-control.component.scss']
})
export class PanelControlComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('completitudChart') completitudChart!: ElementRef<HTMLCanvasElement>;

  private apiUrlReportes = `${environment.apiUrl}/reportes`;
  private apiUrlUsuarios = `${environment.apiUrl}/usuarios`;
  private apiUrlEvaluaciones = `${environment.apiUrl}/evaluaciones`;

  loading: boolean = true;
  
  estadisticas: Estadisticas = {
    total_colaboradores: 0,
    evaluaciones_completadas: 0,
    pendientes: 0,
    promedio_global: 0,
    sin_asignar: 0
  };

  actividadReciente: ActividadReciente[] = [];
  completitudPorArea: CompletitudArea[] = [];

  private chart: Chart | null = null;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  // ========================================
  // CICLO DE VIDA
  // ========================================

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    // El gráfico se creará después de cargar los datos
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  // ========================================
  // CARGA DE DATOS DESDE API
  // ========================================

  async cargarDatos(): Promise<void> {
    this.loading = true;

    try {
      // Cargar datos en paralelo usando forkJoin
      await Promise.all([
        this.cargarEstadisticas(),
        this.cargarCompletitudPorArea(),
        this.cargarActividadReciente()
      ]);

      // Crear gráfico después de cargar los datos
      setTimeout(() => {
        this.createCompletitudChart();
      }, 100);

    } catch (error) {
      console.error('❌ Error al cargar datos del panel:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los datos del panel de control',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      this.loading = false;
    }
  }

  /**
   * Carga estadísticas generales desde el endpoint de reportes
   */
  cargarEstadisticas(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<EstadisticasGenerales>(`${this.apiUrlReportes}/estadisticas-generales`).subscribe({
        next: (data) => {
          console.log('📊 Estadísticas generales recibidas:', data);
          
          // Mapear datos del API a nuestro modelo local
          this.estadisticas = {
            total_colaboradores: data.total_colaboradores,
            evaluaciones_completadas: data.evaluaciones_completas,
            pendientes: data.evaluaciones_pendientes,
            promedio_global: data.promedio_general,
            sin_asignar: data.total_colaboradores - (data.evaluaciones_completas + data.evaluaciones_pendientes)
          };

          resolve();
        },
        error: (error) => {
          console.error('Error al cargar estadísticas:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Carga ranking de áreas y calcula completitud por área
   */
  cargarCompletitudPorArea(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<AreaRanking[]>(`${this.apiUrlReportes}/areas-ranking`).subscribe({
        next: (data) => {
          console.log('📊 Ranking de áreas recibido:', data);
          
          // Calcular completitud por área
          // Necesitamos obtener el total de colaboradores por área y sus evaluaciones
          this.completitudPorArea = data.map(area => {
            const total = area.total_colaboradores;
            const completadas = area.evaluaciones_completas;
            const pendientes = total - completadas;

            return {
              area: area.area,
              completadas: completadas,
              pendientes: pendientes > 0 ? pendientes : 0,
              total: total
            };
          });

          resolve();
        },
        error: (error) => {
          console.error('Error al cargar completitud por área:', error);
          // Si falla, usar datos vacíos
          this.completitudPorArea = [];
          resolve(); // No rechazamos para que continue con otros datos
        }
      });
    });
  }

  /**
   * Carga actividad reciente basada en evaluaciones asignadas
   */
  cargarActividadReciente(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Obtener evaluaciones recientes (últimas 20)
      this.http.get<EvaluacionAsignada[]>(`${this.apiUrlEvaluaciones}/asignadas`).subscribe({
        next: (evaluaciones) => {
          console.log('📋 Evaluaciones asignadas recibidas:', evaluaciones);

          // Ordenar por fecha más reciente
          const evaluacionesOrdenadas = evaluaciones
            .sort((a, b) => new Date(b.fecha_asignacion).getTime() - new Date(a.fecha_asignacion).getTime())
            .slice(0, 5); // Tomar solo las 5 más recientes

          // Convertir a formato de actividad
          this.actividadReciente = evaluacionesOrdenadas.map(ev => {
            const fechaAsignacion = new Date(ev.fecha_asignacion);
            const tiempoTranscurrido = this.calcularTiempoTranscurrido(fechaAsignacion);

            let accion = '';
            let usuario = '';

            if (ev.estado === 'Completada') {
              usuario = ev.evaluador_nombre || `Usuario #${ev.id_evaluador}`;
              accion = `Completó evaluación de ${ev.evaluado_nombre || 'colaborador'}`;
            } else if (ev.estado === 'Pendiente') {
              usuario = ev.evaluador_nombre || `Usuario #${ev.id_evaluador}`;
              accion = `Evaluación ${ev.tipo_evaluacion} asignada`;
            } else {
              usuario = ev.evaluador_nombre || `Usuario #${ev.id_evaluador}`;
              accion = `Evaluación ${ev.estado.toLowerCase()}`;
            }

            return {
              usuario: usuario,
              accion: accion,
              tiempo: tiempoTranscurrido
            };
          });

          // Si no hay actividades, agregar mensaje
          if (this.actividadReciente.length === 0) {
            this.actividadReciente = [{
              usuario: 'Sistema',
              accion: 'No hay actividad reciente',
              tiempo: 'Ahora'
            }];
          }

          resolve();
        },
        error: (error) => {
          console.error('Error al cargar actividad reciente:', error);
          // Actividad por defecto si falla
          this.actividadReciente = [{
            usuario: 'Sistema',
            accion: 'Error al cargar actividad',
            tiempo: 'Ahora'
          }];
          resolve(); // No rechazamos para que continue
        }
      });
    });
  }

  /**
   * Calcula el tiempo transcurrido desde una fecha
   */
  calcularTiempoTranscurrido(fecha: Date): string {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();

    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    
    return fecha.toLocaleDateString();
  }

  // ========================================
  // GRÁFICOS
  // ========================================

  createCompletitudChart(): void {
    if (!this.completitudChart || this.completitudPorArea.length === 0) {
      console.log('⚠️ No se puede crear gráfico: faltan datos o elemento');
      return;
    }

    // Destruir gráfico anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.completitudChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const areas = this.completitudPorArea.map(item => item.area);
    const completadas = this.completitudPorArea.map(item => item.completadas);
    const pendientes = this.completitudPorArea.map(item => item.pendientes);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: areas,
        datasets: [
          {
            label: 'Completadas',
            data: completadas,
            backgroundColor: '#10b981',
            borderRadius: 6,
            barThickness: 30
          },
          {
            label: 'Pendientes',
            data: pendientes,
            backgroundColor: '#f59e0b',
            borderRadius: 6,
            barThickness: 30
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1f2937',
            padding: 12,
            cornerRadius: 8,
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#374151',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12,
                family: "'Inter', sans-serif"
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#f3f4f6'
            },
            ticks: {
              font: {
                size: 12,
                family: "'Inter', sans-serif"
              },
              stepSize: 5
            }
          }
        }
      }
    });
  }

  // ========================================
  // CÁLCULOS
  // ========================================

  getCompletadasPercentage(): number {
    const total = this.estadisticas.evaluaciones_completadas + this.estadisticas.pendientes;
    if (total === 0) return 0;
    return (this.estadisticas.evaluaciones_completadas / total) * 100;
  }

  getPendientesPercentage(): number {
    const total = this.estadisticas.evaluaciones_completadas + this.estadisticas.pendientes;
    if (total === 0) return 0;
    return (this.estadisticas.pendientes / total) * 100;
  }

  getInitials(nombre: string): string {
    if (!nombre) return '??';
    
    const words = nombre.trim().split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  // ========================================
  // NAVEGACIÓN
  // ========================================

  crearFormulario(): void {
    this.router.navigate(['/rrhh/formularios']);
  }

  navegarFormularios(): void {
    this.router.navigate(['/rrhh/formularios']);
  }

  navegarReportes(): void {
    this.router.navigate(['/rrhh/reportes']);
  }
}