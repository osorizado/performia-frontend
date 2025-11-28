import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Objetivo {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  progreso: number;
  estado: 'En Curso' | 'Completado' | 'En Pausa';
  prioridad: 'Alta' | 'Media' | 'Baja';
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface ObjetivoCreate {
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  prioridad?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ObjetivosService {
  private apiUrl = `${environment.apiUrl}/objetivos`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // GET /api/objetivos/mis-objetivos - Obtener objetivos del usuario actual
  getMisObjetivos(): Observable<Objetivo[]> {
    return this.http.get<Objetivo[]>(`${this.apiUrl}/mis-objetivos`, {
      headers: this.getHeaders()
    });
  }

  // GET /api/objetivos/ - Listar todos los objetivos
  listarObjetivos(): Observable<Objetivo[]> {
    return this.http.get<Objetivo[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  // GET /api/objetivos/{objetivo_id} - Obtener un objetivo específico
  obtenerObjetivo(objetivoId: number): Observable<Objetivo> {
    return this.http.get<Objetivo>(`${this.apiUrl}/${objetivoId}`, {
      headers: this.getHeaders()
    });
  }

  // POST /api/objetivos/ - Crear nuevo objetivo
  crearObjetivo(objetivo: ObjetivoCreate): Observable<Objetivo> {
    return this.http.post<Objetivo>(this.apiUrl, objetivo, {
      headers: this.getHeaders()
    });
  }

  // PUT /api/objetivos/{objetivo_id} - Actualizar objetivo
  actualizarObjetivo(objetivoId: number, objetivo: Partial<Objetivo>): Observable<Objetivo> {
    return this.http.put<Objetivo>(`${this.apiUrl}/${objetivoId}`, objetivo, {
      headers: this.getHeaders()
    });
  }

  // DELETE /api/objetivos/{objetivo_id} - Eliminar objetivo
  eliminarObjetivo(objetivoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${objetivoId}`, {
      headers: this.getHeaders()
    });
  }
}
