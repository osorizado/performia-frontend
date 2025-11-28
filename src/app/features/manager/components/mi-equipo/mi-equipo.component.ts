import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EquipoService, Colaborador } from '../../services/equipo.service';

@Component({
  selector: 'app-mi-equipo',
  templateUrl: './mi-equipo.component.html',
  styleUrls: ['./mi-equipo.component.scss']
})
export class MiEquipoComponent implements OnInit {
  colaboradores: Colaborador[] = [];
  filtroEstado: string = 'todos';
  busqueda: string = '';
  loading: boolean = true;

  constructor(
    private equipoService: EquipoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadColaboradores();
    this.checkQueryParams();
  }

  checkQueryParams(): void {
    // Verificar si hay un userId en los query params para mostrar detalles
    this.route.queryParams.subscribe(params => {
      if (params['userId']) {
        const userId = parseInt(params['userId']);
        // Aquí podrías implementar la lógica para mostrar un modal de detalles
        console.log('Mostrar detalles del colaborador:', userId);
      }
    });
  }

  loadColaboradores(): void {
    this.loading = true;
    
    // Llamada real al backend
    this.equipoService.getMiEquipo().subscribe({
      next: (colaboradores) => {
        this.colaboradores = colaboradores;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar colaboradores:', error);
        this.colaboradores = [];
        this.loading = false;
      }
    });
  }

  get colaboradoresFiltrados(): Colaborador[] {
    let resultado = [...this.colaboradores];

    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      resultado = resultado.filter(col => col.estado_evaluacion === this.filtroEstado);
    }

    // Filtrar por búsqueda
    if (this.busqueda.trim()) {
      const busquedaLower = this.busqueda.toLowerCase();
      resultado = resultado.filter(col => 
        col.nombre.toLowerCase().includes(busquedaLower) ||
        col.apellido.toLowerCase().includes(busquedaLower) ||
        col.cargo.toLowerCase().includes(busquedaLower) ||
        col.area.toLowerCase().includes(busquedaLower)
      );
    }

    return resultado;
  }

  verDetalles(colaborador: Colaborador): void {
    // Navegar a evaluaciones con el ID del colaborador
    this.router.navigate(['/manager/evaluaciones'], {
      queryParams: { userId: colaborador.id_usuario, modo: 'ver' }
    });
  }

  evaluarColaborador(colaborador: Colaborador): void {
    // Navegar a evaluaciones con el ID del colaborador
    this.router.navigate(['/manager/evaluaciones'], {
      queryParams: { userId: colaborador.id_usuario }
    });
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'Completada': 
        return 'badge-success';
      case 'En Curso': 
        return 'badge-warning';
      case 'Pendiente': 
        return 'badge-danger';
      default: 
        return 'badge-info';
    }
  }
}