import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Evaluacion {
  id: number;
  tipo: string;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  fecha_inicio: string;
  fecha_fin: string;
  puntuacion_final?: number;
  user_id: number;
  formulario_id: number;
  periodo: string;
  created_at: string;
  updated_at: string;
}

export interface EvaluacionPendiente {
  id: number;
  tipo: string;
  fecha_limite: string;
  formulario: {
    titulo: string;
    descripcion: string;
  };
}

export interface RespuestaEvaluacion {
  pregunta_id: number;
  valor_respuesta: any;
  comentario?: string;
}

export interface IniciarEvaluacionRequest {
  formulario_id: number;
  tipo: string;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface Resultado {
  id: number;
  evaluacion_id: number;
  puntuacion: number;
  comentarios: string;
  fortalezas: string[];
  areas_mejora: string[];
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluacionesService {
  private apiUrl = `${environment.apiUrl}/evaluaciones`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // GET /api/evaluaciones/pendientes - Obtener evaluaciones pendientes del usuario
  getEvaluacionesPendientes(): Observable<EvaluacionPendiente[]> {
    return this.http.get<EvaluacionPendiente[]>(`${this.apiUrl}/pendientes`, {
      headers: this.getHeaders()
    });
  }

  // GET /api/evaluaciones/mis-evaluaciones - Obtener todas las evaluaciones del usuario
  getMisEvaluaciones(): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(`${this.apiUrl}/mis-evaluaciones`, {
      headers: this.getHeaders()
    });
  }

  // GET /api/evaluaciones/periodo/{periodo} - Obtener evaluaciones por periodo
  getEvaluacionesPorPeriodo(periodo: string): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(`${this.apiUrl}/periodo/${periodo}`, {
      headers: this.getHeaders()
    });
  }

  // GET /api/evaluaciones/{evaluacion_id} - Obtener una evaluación específica
  getEvaluacion(evaluacionId: number): Observable<Evaluacion> {
    return this.http.get<Evaluacion>(`${this.apiUrl}/${evaluacionId}`, {
      headers: this.getHeaders()
    });
  }

  // POST /api/evaluaciones/iniciar - Iniciar una nueva evaluación
  iniciarEvaluacion(data: IniciarEvaluacionRequest): Observable<Evaluacion> {
    return this.http.post<Evaluacion>(`${this.apiUrl}/iniciar`, data, {
      headers: this.getHeaders()
    });
  }

  // POST /api/evaluaciones/{evaluacion_id}/responder - Responder evaluación
  responderEvaluacion(evaluacionId: number, respuestas: RespuestaEvaluacion[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${evaluacionId}/responder`, 
      { respuestas }, 
      { headers: this.getHeaders() }
    );
  }

  // POST /api/evaluaciones/{evaluacion_id}/completar - Completar evaluación
  completarEvaluacion(evaluacionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${evaluacionId}/completar`, {}, {
      headers: this.getHeaders()
    });
  }

  // POST /api/evaluaciones/{evaluacion_id}/cancelar - Cancelar evaluación
  cancelarEvaluacion(evaluacionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${evaluacionId}/cancelar`, {}, {
      headers: this.getHeaders()
    });
  }

  // GET /api/evaluaciones/{evaluacion_id}/resultados - Obtener resultados de evaluación
  getResultados(evaluacionId: number): Observable<Resultado[]> {
    return this.http.get<Resultado[]>(`${this.apiUrl}/${evaluacionId}/resultados`, {
      headers: this.getHeaders()
    });
  }

  // GET /api/evaluaciones/ - Listar todas las evaluaciones
  listarEvaluaciones(): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }
}
