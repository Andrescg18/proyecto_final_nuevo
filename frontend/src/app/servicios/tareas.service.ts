import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Tarea {
  id?: number;
  titulo: string;
  resumen?: string;
  expira?: string;
  idUsuario: string;
  completada?: boolean|number;
}

@Injectable({
  providedIn: 'root'
})
export class TareasService {
  private baseUrl = `${environment.apiUrl}/api/tareas`;

  constructor(private http: HttpClient) {}

  obtenerTareasPorUsuario(idUsuario: string): Observable<Tarea[]> {
    // Añadimos un timestamp para evitar que el navegador use una versión cacheada
    return this.http.get<Tarea[]>(`${this.baseUrl}/${idUsuario}?t=${Date.now()}`);
  }

  crearTarea(tarea: Tarea): Observable<any> {
    return this.http.post(this.baseUrl, tarea);
  }

  actualizarTarea(id: number, tarea: Partial<Tarea>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, tarea);
  }

  eliminarTarea(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}