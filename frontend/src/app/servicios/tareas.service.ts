import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private get baseUrl() {
    const host = typeof window !== 'undefined' ? window.location.origin : '';
    // Si estamos en localhost, usamos el backend local. Si no, usamos el de Railway.
    const apiBase = host.includes('localhost') 
      ? 'http://localhost:3000' 
      : 'https://proyectofinalnuevo-production.up.railway.app'; 
    return `${apiBase}/api/tareas`;
  }


  constructor(private http: HttpClient) {}

  obtenerTareasPorUsuario(idUsuario: string): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.baseUrl}/${idUsuario}`);
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