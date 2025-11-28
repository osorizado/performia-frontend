import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import Swal from 'sweetalert2';
import { environment } from '@environments/environment';

Chart.register(...registerables);

interface AreaRanking {
  area: string;
  promedio: number | null;
  total_colaboradores: number;
  evaluaciones_completas: number;
}

@Component({
  selector: 'app-vista-areas',
  templateUrl: './vista-areas.component.html',
  styleUrls: ['./vista-areas.component.scss']
})
export class VistaAreasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('areasChart') areasChart!: ElementRef<HTMLCanvasElement>;

  private apiUrl = `${environment.apiUrl}/reportes`;
  
  loading: boolean = true;
  mostrarFiltros: boolean = false;
  
  areasRanking: AreaRanking[] = [];
  
  filtros = {
    periodo: null as string | null
  };
  
  private chart: Chart | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    // El gráfico se creará después de cargar los datos
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
  }

  async cargarDatos(): Promise<void> {
    this.loading = true;
    
    try {
      await this.cargarAreas();
      
      setTimeout(() => {
        this.crearGrafico();
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

  cargarAreas(): Promise<void> {
    return new Promise((resolve, reject) => {
      let url = `${this.apiUrl}/areas-ranking`;
      if (this.filtros.periodo) {
        url += `?periodo=${this.filtros.periodo}`;
      }
      
      this.http.get<AreaRanking[]>(url).subscribe({
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

  crearGrafico(): void {
    if (!this.areasChart || this.areasRanking.length === 0) return;
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    const ctx = this.areasChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.areasRanking.map(a => a.area);
    const data = this.areasRanking.map(a => a.promedio ?? 0);
    
    // Colores dinámicos basados en el promedio
    const backgroundColors = data.map(promedio => {
      if (promedio >= 4.5) return '#10b981'; // Verde
      if (promedio >= 4.0) return '#3b82f6'; // Azul
      if (promedio >= 3.5) return '#f59e0b'; // Naranja
      return '#ef4444'; // Rojo
    });

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Promedio',
          data: data,
          backgroundColor: backgroundColors,
          borderRadius: 8,
          barThickness: 60
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
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const area = this.areasRanking[context.dataIndex];
                return [
                  `Promedio: ${(context.parsed.y ?? 0).toFixed(2)}`,
                  `Colaboradores: ${area.total_colaboradores}`,
                  `Evaluaciones: ${area.evaluaciones_completas}`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1
            },
            grid: {
              color: '#e5e7eb'
            }
          },
          x: {
            grid: {
              display: false
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

  volver(): void {
    this.router.navigate(['/director/dashboard']);
  }

  verDetalle(area: AreaRanking): void {
    const completitud = area.total_colaboradores > 0 
      ? ((area.evaluaciones_completas / area.total_colaboradores) * 100).toFixed(0)
      : '0';
      
    Swal.fire({
      title: `Detalle de ${area.area}`,
      html: `
        <div style="text-align: left; padding: 1rem;">
          <p><strong>Promedio:</strong> ${(area.promedio ?? 0).toFixed(2)}</p>
          <p><strong>Total Colaboradores:</strong> ${area.total_colaboradores || 0}</p>
          <p><strong>Evaluaciones Completas:</strong> ${area.evaluaciones_completas || 0}</p>
          <p><strong>Tasa de Completitud:</strong> ${completitud}%</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar'
    });
  }

  exportarArea(area: AreaRanking): void {
    Swal.fire({
      title: 'Generando reporte...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const filtrosReporte = {
      tipo_reporte: 'Por Área',
      formato: 'PDF',
      periodo: this.filtros.periodo,
      area: area.area,
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
        link.download = `Reporte_${area.area}_${timestamp}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        Swal.fire({
          title: '¡Éxito!',
          text: 'Reporte descargado correctamente',
          icon: 'success',
          timer: 2000
        });
      },
      error: (error) => {
        console.error('Error al generar reporte:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo generar el reporte',
          icon: 'error'
        });
      }
    });
  }
}