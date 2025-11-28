import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Colaborador {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  cargo: string;
  area: string;
  desempeno_promedio?: number;
  objetivos_completados?: number;
  objetivos_totales?: number;
  evaluaciones_pendientes?: number;
  ultima_evaluacion?: string;
  estado_evaluacion?: 'Completada' | 'En Curso' | 'Pendiente';
  estado?: string;
}

export interface EstadisticasEquipo {
  total_colaboradores: number;
  evaluaciones_completadas: number;
  evaluaciones_pendientes: number;
  desempeno_promedio: number;
  objetivos_en_curso: number;
}

@Injectable({
  providedIn: 'root'
})
export class EquipoService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener lista de colaboradores del equipo del manager
  getMiEquipo(): Observable<Colaborador[]> {
    return this.http.get<Colaborador[]>(`${this.apiUrl}/users/mi-equipo`, {
      headers: this.getHeaders()
    });
  }

  // Obtener estadísticas del equipo
  getEstadisticasEquipo(): Observable<EstadisticasEquipo> {
    return this.http.get<EstadisticasEquipo>(`${this.apiUrl}/users/estadisticas-equipo`, {
      headers: this.getHeaders()
    });
  }

  // Obtener detalles de un colaborador específico
  getColaborador(userId: number): Observable<Colaborador> {
    return this.http.get<Colaborador>(`${this.apiUrl}/users/${userId}`, {
      headers: this.getHeaders()
    });
  }
}