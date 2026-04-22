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
    if (typeof window === 'undefined') return '';
    
    const host = window.location.hostname;
    let apiBase = '';

    if (host === 'localhost' || host === '127.0.0.1') {
      apiBase = 'http://localhost:3000';
    } else if (host.includes('vercel.app')) {
      // Endpoint original de Railway
      apiBase = 'https://proyectofinalnuevo-production.up.railway.app';
    } else {
      // Endpoint por defecto para Render u otros servicios
      // Puedes cambiar este URL cuando tengas tu URL final de Render
      apiBase = 'https://evidence-management-backend.onrender.com';
    }

    return `${apiBase}/api/tareas`;
  }


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