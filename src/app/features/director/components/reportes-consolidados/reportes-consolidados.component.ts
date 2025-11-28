import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
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

interface DistribucionCalificaciones {
  [key: string]: number;
}

@Component({
  selector: 'app-reportes-consolidados',
  templateUrl: './reportes-consolidados.component.html',
  styleUrls: ['./reportes-consolidados.component.scss']
})
export class ReportesConsolidadosComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('competenciasChart') competenciasChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('distribucionChart') distribucionChart!: ElementRef<HTMLCanvasElement>;

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
  distribucion: DistribucionCalificaciones = {};
  
  filtros = {
    periodo: null as string | null,
    area: null as string | null
  };
  
  private chartCompetencias: Chart | null = null;
  private chartDistribucion: Chart | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  ngOnDestroy(): void {
    if (this.chartCompetencias) this.chartCompetencias.destroy();
    if (this.chartDistribucion) this.chartDistribucion.destroy();
  }

  async cargarDatos(): Promise<void> {
    this.loading = true;
    
    try {
      await Promise.all([
        this.cargarEstadisticas(),
        this.cargarCompetencias(),
        this.cargarDistribucion()
      ]);
      
      setTimeout(() => {
        this.crearGraficos();
      }, 100);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los datos',
        icon: 'error'
      });
    } finally {
      this.loading = false;
    }
  }

  cargarEstadisticas(): Promise<void> {
    return new Promise((resolve, reject) => {
      let url = `${this.apiUrl}/estadisticas-generales`;
      const params = [];
      if (this.filtros.periodo) params.push(`periodo=${this.filtros.periodo}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
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
      const params = [];
      if (this.filtros.periodo) params.push(`periodo=${this.filtros.periodo}`);
      if (this.filtros.area) params.push(`area=${this.filtros.area}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
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

  cargarDistribucion(): Promise<void> {
    return new Promise((resolve, reject) => {
      let url = `${this.apiUrl}/distribucion-calificaciones`;
      if (this.filtros.periodo) {
        url += `?periodo=${this.filtros.periodo}`;
      }
      
      this.http.get<DistribucionCalificaciones>(url).subscribe({
        next: (data) => {
          this.distribucion = data;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar distribución:', error);
          reject(error);
        }
      });
    });
  }

  crearGraficos(): void {
    this.crearGraficoCompetencias();
    this.crearGraficoDistribucion();
  }

  crearGraficoCompetencias(): void {
    if (!this.competenciasChart || this.competencias.length === 0) return;
    
    if (this.chartCompetencias) {
      this.chartCompetencias.destroy();
    }
    
    const ctx = this.competenciasChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.competencias.map(c => c.competencia);
    const data = this.competencias.map(c => c.promedio);

    this.chartCompetencias = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Promedio Organizacional',
          data: data,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(59, 130, 246)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    });
  }

  crearGraficoDistribucion(): void {
    if (!this.distribucionChart || Object.keys(this.distribucion).length === 0) return;
    
    if (this.chartDistribucion) {
      this.chartDistribucion.destroy();
    }
    
    const ctx = this.distribucionChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(this.distribucion);
    const data = Object.values(this.distribucion);

    this.chartDistribucion = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Colaboradores',
          data: data,
          backgroundColor: '#3b82f6',
          borderRadius: 6
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
            ticks: {
              stepSize: 10
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
    this.filtros = {
      periodo: null,
      area: null
    };
    this.cargarDatos();
  }

  volver(): void {
    this.router.navigate(['/director/dashboard']);
  }

  exportarPDF(): void {
    Swal.fire({
      title: 'Generando PDF...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const filtrosReporte = {
      tipo_reporte: 'Global',
      formato: 'PDF',
      periodo: this.filtros.periodo,
      area: this.filtros.area,
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
        link.download = `Reporte_Consolidado_${timestamp}.pdf`;
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

  exportarExcel(): void {
    Swal.fire({
      title: 'Generando Excel...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const filtrosReporte = {
      tipo_reporte: 'Global',
      formato: 'Excel',
      periodo: this.filtros.periodo,
      area: this.filtros.area,
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
        link.download = `Reporte_Consolidado_${timestamp}.xlsx`;
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