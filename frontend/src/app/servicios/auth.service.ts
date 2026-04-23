import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  token: string;
  username: string;
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  private isAdminSignal = signal<boolean>(false);
  private userIdSignal = signal<number | null>(null);
  
  public isAdmin = this.isAdminSignal.asReadonly();
  public userId = this.userIdSignal.asReadonly();

  constructor(private http: HttpClient) {
    this.checkInitialState();
  }

  private checkInitialState() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      const userId = localStorage.getItem('admin_id');
      this.isAdminSignal.set(!!token);
      if (userId) this.userIdSignal.set(parseInt(userId));
    }
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(res => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', res.token);
          localStorage.setItem('admin_id', res.id.toString());
          this.isAdminSignal.set(true);
          this.userIdSignal.set(res.id);
        }
      })
    );
  }

  crearAdministrador(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admins`, { username, password });
  }

  editarPerfil(username?: string, password?: string): Observable<any> {
    const payload: any = {};
    if (username) payload.username = username;
    if (password) payload.password = password;
    return this.http.put(`${this.apiUrl}/admins`, payload);
  }

  obtenerAdministradores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admins`);
  }

  eliminarAdministrador(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admins/${id}`);
  }

  cambiarPasswordAdmin(id: number, password: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admins/${id}/password`, { password });
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_id');
      this.isAdminSignal.set(false);
      this.userIdSignal.set(null);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token');
    }
    return null;
  }
}
