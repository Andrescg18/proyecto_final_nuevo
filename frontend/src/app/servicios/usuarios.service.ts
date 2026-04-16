import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: string;
  nombre: string;
  avatar: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private get baseUrl() {
    const host = typeof window !== 'undefined' ? window.location.origin : '';
    const apiBase = host.includes('localhost') 
      ? 'http://localhost:3000' 
      : 'https://proyectofinalnuevo-production.up.railway.app'; 
    return `${apiBase}/api/usuarios`;
  }

  constructor(private http: HttpClient) {}

  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.baseUrl);
  }

  obtenerCatalogo(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/catalogo`);
  }

  crearUsuario(nombre: string, avatar?: string): Observable<any> {
    return this.http.post(this.baseUrl, { nombre, avatar });
  }

  editarPerfil(id: string, nombre?: string, avatar?: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, { nombre, avatar });
  }

  eliminarUsuario(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
