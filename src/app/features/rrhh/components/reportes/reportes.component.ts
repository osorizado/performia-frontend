import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import Swal from 'sweetalert2';
import { environment } from '@environments/environment';

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

interface EstadisticasCompetencias {
  competencia: string;
  promedio: number;
  cantidad_evaluaciones: number;
}

interface DistribucionCalificaciones {
  [key: string]: number; // "1.0-2.0": 5, etc.
}

interface TopPerformer {
  id_usuario: number;
  nombre: string;
  apellido: string;
  area: string | null;
  puesto: string | null;
  promedio: number;
  evaluaciones_completas: number;
}

interface AreaRanking {
  area: string;
  promedio: number;
  total_colaboradores: number;
  evaluaciones_completas: number;
}

interface FiltrosReporte {
  tipo_reporte: string;
  formato: string;
  periodo: string | null;
  area: string | null;
  id_colaborador: number | null;
  id_formulario: number | null;
  incluir_graficos: boolean;
  incluir_detalles: boolean;
}

// ========================================
// COMPONENTE
// ========================================

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('competenciasChart') competenciasChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('distribucionChart') distribucionChart!: ElementRef<HTMLCanvasElement>;

  private apiUrl = `${environment.apiUrl}/reportes`;
  
  loading: boolean = true;
  mostrarFiltros: boolean = false;
  
  // Exponer Object para usar en el template
  Object = Object;
  
  // Datos
  estadisticas: EstadisticasGenerales = {
    promedio_general: 0,
    evaluaciones_completas: 0,
    evaluaciones_pendientes: 0,
    tasa_completitud: 0,
    top_performers: 0,
    total_colaboradores: 0,
    total_evaluadores: 0
  };
  
  competencias: EstadisticasCompetencias[] = [];
  distribucion: DistribucionCalificaciones = {};
  topPerformers: TopPerformer[] = [];
  areasRanking: AreaRanking[] = [];
  
  // Filtros
  filtros = {
    periodo: null as string | null,
    area: null as string | null,
    tipoReporte: 'Global'
  };
  
  // Gráficos
  private chartCompetencias: Chart | null = null;
  private chartDistribucion: Chart | null = null;

  constructor(private http: HttpClient) {}

  // ========================================
  // CICLO DE VIDA
  // ========================================

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

  // ========================================
  // CARGA DE DATOS
  // ========================================

  async cargarDatos(): Promise<void> {
    this.loading = true;
    
    try {
      // Cargar datos en paralelo
      await Promise.all([
        this.cargarEstadisticasGenerales(),
        this.cargarEstadisticasCompetencias(),
        this.cargarDistribucionCalificaciones(),
        this.cargarTopPerformers(),
        this.cargarAreasRanking()
      ]);
      
      // Crear gráficos después de cargar los datos
      setTimeout(() => {
        this.crearGraficos();
      }, 100);
      
    } catch (error) {
      console.error('❌ Error al cargar datos de reportes:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los datos de reportes',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      this.loading = false;
    }
  }

  cargarEstadisticasGenerales(): Promise<void> {
    return new Promise((resolve, reject) => {
      let url = `${this.apiUrl}/estadisticas-generales`;
      if (this.filtros.periodo) {
        url += `?periodo=${this.filtros.periodo}`;
      }
      
      this.http.get<EstadisticasGenerales>(url).subscribe({
        next: (data) => {
          this.estadisticas = data;
          console.log('📊 Estadísticas generales:', data);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar estadísticas generales:', error);
          reject(error);
        }
      });
    });
  }

  cargarEstadisticasCompetencias(): Promise<void> {
    return new Promise((resolve, reject) => {
      let url = `${this.apiUrl}/estadisticas-competencias`;
      const params: string[] = [];
      
      if (this.filtros.periodo) params.push(`periodo=${this.filtros.periodo}`);
      if (this.filtros.area) params.push(`area=${this.filtros.area}`);
      
      if (params.length > 0) url += `?${params.join('&')}`;
      
      this.http.get<EstadisticasCompetencias[]>(url).subscribe({
        next: (data) => {
          this.competencias = data;
          console.log('📊 Estadísticas de competencias:', data);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar competencias:', error);
          reject(error);
        }
      });
    });
  }

  cargarDistribucionCalificaciones(): Promise<void> {
    return new Promise((resolve, reject) => {
      let url = `${this.apiUrl}/distribucion-calificaciones`;
      if (this.filtros.periodo) {
        url += `?periodo=${this.filtros.periodo}`;
      }
      
      this.http.get<DistribucionCalificaciones>(url).subscribe({
        next: (data) => {
          this.distribucion = data;
          console.log('📊 Distribución de calificaciones:', data);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar distribución:', error);
          reject(error);
        }
      });
    });
  }

  cargarTopPerformers(): Promise<void> {
    return new Promise((resolve, reject) => {
      let url = `${this.apiUrl}/top-performers?limite=10`;
      if (this.filtros.periodo) {
        url += `&periodo=${this.filtros.periodo}`;
      }
      
      this.http.get<TopPerformer[]>(url).subscribe({
        next: (data) => {
          this.topPerformers = data;
          console.log('🌟 Top performers:', data);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar top performers:', error);
          reject(error);
        }
      });
    });
  }

  cargarAreasRanking(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${this.apiUrl}/areas-ranking`;
      
      this.http.get<AreaRanking[]>(url).subscribe({
        next: (data) => {
          this.areasRanking = data;
          console.log('🏢 Ranking de áreas:', data);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar áreas:', error);
          reject(error);
        }
      });
    });
  }

  // ========================================
  // GRÁFICOS
  // ========================================

  crearGraficos(): void {
    this.crearGraficoCompetencias();
    this.crearGraficoDistribucion();
  }

  crearGraficoCompetencias(): void {
    if (!this.competenciasChart || this.competencias.length === 0) return;
    
    // Destruir gráfico anterior si existe
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
    
    // Destruir gráfico anterior si existe
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
          borderRadius: 6,
          barThickness: 50
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

  // ========================================
  // FILTROS
  // ========================================

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros:', this.filtros);
    this.cargarDatos();
    this.mostrarFiltros = false;
  }

  limpiarFiltros(): void {
    this.filtros = {
      periodo: null,
      area: null,
      tipoReporte: 'Global'
    };
    this.cargarDatos();
  }

  // ========================================
  // EXPORTACIÓN
  // ========================================

  exportarPDF(): void {
    this.loading = true;
    
    const filtrosReporte: FiltrosReporte = {
      tipo_reporte: this.filtros.tipoReporte,
      formato: 'PDF',
      periodo: this.filtros.periodo,
      area: this.filtros.area,
      id_colaborador: null,
      id_formulario: null,
      incluir_graficos: true,
      incluir_detalles: true
    };

    // ⚠️ IMPORTANTE: responseType: 'blob' para archivos binarios
    this.http.post(`${this.apiUrl}/generar`, filtrosReporte, { 
      responseType: 'blob',
      observe: 'body'
    }).subscribe({
      next: (blob: Blob) => {
        console.log('📄 PDF recibido como blob');
        
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear enlace temporal para descargar
        const link = document.createElement('a');
        link.href = url;
        
        // Nombre del archivo con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        link.download = `Reporte_${this.filtros.tipoReporte}_${timestamp}.pdf`;
        
        // Trigger descarga
        document.body.appendChild(link);
        link.click();
        
        // Limpiar
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.loading = false;
        
        Swal.fire({
          title: '¡Reporte Descargado!',
          text: 'El reporte PDF se ha descargado correctamente',
          icon: 'success',
          confirmButtonColor: '#28a745',
          timer: 3000
        });
      },
      error: (error) => {
        console.error('❌ Error al generar PDF:', error);
        this.loading = false;
        
        Swal.fire({
          title: 'Error',
          text: 'No se pudo generar el reporte PDF',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  exportarExcel(): void {
    this.loading = true;
    
    const filtrosReporte: FiltrosReporte = {
      tipo_reporte: this.filtros.tipoReporte,
      formato: 'Excel',
      periodo: this.filtros.periodo,
      area: this.filtros.area,
      id_colaborador: null,
      id_formulario: null,
      incluir_graficos: false,
      incluir_detalles: true
    };

    // ⚠️ IMPORTANTE: responseType: 'blob' para archivos binarios
    this.http.post(`${this.apiUrl}/generar`, filtrosReporte, {
      responseType: 'blob',
      observe: 'body'
    }).subscribe({
      next: (blob: Blob) => {
        console.log('📊 Excel recibido como blob');
        
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear enlace temporal para descargar
        const link = document.createElement('a');
        link.href = url;
        
        // Nombre del archivo con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        link.download = `Reporte_${this.filtros.tipoReporte}_${timestamp}.xlsx`;
        
        // Trigger descarga
        document.body.appendChild(link);
        link.click();
        
        // Limpiar
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.loading = false;
        
        Swal.fire({
          title: '¡Reporte Descargado!',
          text: 'El archivo Excel se ha descargado correctamente',
          icon: 'success',
          confirmButtonColor: '#28a745',
          timer: 3000
        });
      },
      error: (error) => {
        console.error('❌ Error al generar Excel:', error);
        this.loading = false;
        
        Swal.fire({
          title: 'Error',
          text: 'No se pudo generar el archivo Excel',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    });
  }
}