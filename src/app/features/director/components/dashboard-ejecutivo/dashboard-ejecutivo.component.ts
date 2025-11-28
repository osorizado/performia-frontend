import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import Swal from 'sweetalert2';
import { environment } from '@environments/environment';

Chart.register(...registerables);

interface EstadisticasGenerales {
  promedio_general: number;
  evaluaciones_completas: number;
  evaluaciones_pendientes: number;
  tasa_completitud: number;
  top_performers: number;
  total_colaboradores: number;
}

interface EstadisticasCompetencias {
  competencia: string;
  promedio: number;
  cantidad_evaluaciones: number;
}

interface AreaRanking {
  area: string;
  promedio: number;
  total_colaboradores: number;
}

@Component({
  selector: 'app-dashboard-ejecutivo',
  templateUrl: './dashboard-ejecutivo.component.html',
  styleUrls: ['./dashboard-ejecutivo.component.scss']
})
export class DashboardEjecutivoComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('evolucionChart') evolucionChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('areasChart') areasChart!: ElementRef<HTMLCanvasElement>;

  private apiUrl = `${environment.apiUrl}/reportes`;
  
  loading: boolean = true;
  mostrarFiltros: boolean = false;
  
  estadisticas: EstadisticasGenerales = {
    promedio_general: 0,
    evaluaciones_completas: 0,
    evaluaciones_pendientes: 0,
    tasa_completitud: 0,
    top_performers: 0,
    total_colaboradores: 0
  };
  
  competencias: EstadisticasCompetencias[] = [];
  areasRanking: AreaRanking[] = [];
  
  filtros = {
    periodo: null as string | null
  };
  
  private chartEvolucion: Chart | null = null;
  private chartAreas: Chart | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  ngOnDestroy(): void {
    if (this.chartEvolucion) this.chartEvolucion.destroy();
    if (this.chartAreas) this.chartAreas.destroy();
  }

  async cargarDatos(): Promise<void> {
    this.loading = true;
    
    try {
      await Promise.all([
        this.cargarEstadisticas(),
        this.cargarCompetencias(),
        this.cargarAreas()
      ]);
      
      setTimeout(() => {
        this.crearGraficos();
      }, 100);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los datos del dashboard',
        icon: 'error'
      });
    } finally {
      this.loading = false;
    }
  }

  cargarEstadisticas(): Promise<void> {
    return new Promise((resolve, reject) => {
      let url = `${this.apiUrl}/estadisticas-generales`;
      if (this.filtros.periodo) {
        url += `?periodo=${this.filtros.periodo}`;
      }
      
      this.http.get<EstadisticasGenerales>(url).subscribe({
        next: (data) => {
          this.estadisticas = data;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar estadísticas:', error);
          reject(error);
        }
      });
    });
  }

  cargarCompetencias(): Promise<void> {
    return new Promise((resolve, reject) => {
      let url = `${this.apiUrl}/estadisticas-competencias`;
      if (this.filtros.periodo) {
        url += `?periodo=${this.filtros.periodo}`;
      }
      
      this.http.get<EstadisticasCompetencias[]>(url).subscribe({
        next: (data) => {
          this.competencias = data.sort((a, b) => b.promedio - a.promedio);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar competencias:', error);
          reject(error);
        }
      });
    });
  }

  cargarAreas(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<AreaRanking[]>(`${this.apiUrl}/areas-ranking`).subscribe({
        next: (data) => {
          this.areasRanking = data;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar áreas:', error);
          reject(error);
        }
      });
    });
  }

  crearGraficos(): void {
    this.crearGraficoEvolucion();
    this.crearGraficoAreas();
  }

  // ✅ CORREGIDO: Ahora usa datos reales de competencias en lugar de datos hardcodeados
  crearGraficoEvolucion(): void {
    if (!this.evolucionChart) return;
    
    if (this.chartEvolucion) {
      this.chartEvolucion.destroy();
    }
    
    const ctx = this.evolucionChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // ✅ USAR DATOS REALES: En lugar de datos hardcodeados, mostrar las competencias ordenadas
    // Como no hay endpoint de evolución histórica, mostramos el progreso de competencias
    const labels = this.competencias.slice(0, 6).map(c => c.competencia.substring(0, 15));
    const data = this.competencias.slice(0, 6).map(c => c.promedio);

    this.chartEvolucion = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Promedio por Competencia',
          data: data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
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
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#3b82f6',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  crearGraficoAreas(): void {
    if (!this.areasChart || this.areasRanking.length === 0) return;
    
    if (this.chartAreas) {
      this.chartAreas.destroy();
    }
    
    const ctx = this.areasChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.areasRanking.map(a => a.area);
    const data = this.areasRanking.map(a => a.promedio);

    this.chartAreas = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Promedio',
          data: data,
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          barThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  aplicarFiltros(): void {
    this.cargarDatos();
    this.mostrarFiltros = false;
  }

  limpiarFiltros(): void {
    this.filtros = { periodo: null };
    this.cargarDatos();
  }

  exportarPDF(): void {
    Swal.fire({
      title: 'Generando PDF...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const filtrosReporte = {
      tipo_reporte: 'Global',
      formato: 'PDF',
      periodo: this.filtros.periodo,
      area: null,
      id_colaborador: null,
      id_formulario: null,
      incluir_graficos: true,
      incluir_detalles: true
    };

    this.http.post(`${this.apiUrl}/generar`, filtrosReporte, {
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        link.download = `Dashboard_Ejecutivo_${timestamp}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        Swal.fire({
          title: '¡Éxito!',
          text: 'PDF descargado correctamente',
          icon: 'success',
          timer: 2000
        });
      },
      error: (error) => {
        console.error('Error al generar PDF:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo generar el PDF',
          icon: 'error'
        });
      }
    });
  }

  descargarExcel(): void {
    Swal.fire({
      title: 'Generando Excel...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const filtrosReporte = {
      tipo_reporte: 'Global',
      formato: 'Excel',
      periodo: this.filtros.periodo,
      area: null,
      id_colaborador: null,
      id_formulario: null,
      incluir_graficos: false,
      incluir_detalles: true
    };

    this.http.post(`${this.apiUrl}/generar`, filtrosReporte, {
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        link.download = `Dashboard_Ejecutivo_${timestamp}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        Swal.fire({
          title: '¡Éxito!',
          text: 'Excel descargado correctamente',
          icon: 'success',
          timer: 2000
        });
      },
      error: (error) => {
        console.error('Error al generar Excel:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo generar el Excel',
          icon: 'error'
        });
      }
    });
  }
}