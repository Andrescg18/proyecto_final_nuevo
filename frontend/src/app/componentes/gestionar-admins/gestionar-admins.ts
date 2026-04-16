import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-gestionar-admins',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestionar-admins.html',
  styleUrls: ['../login/login.css'] // Reusing styles
})
export class GestionarAdminsComponent implements OnInit {
  admins: any[] = [];
  error = '';
  success = '';
  loading = false;

  @Output() close = new EventEmitter<void>();

  authService = inject(AuthService);

  ngOnInit() {
    this.cargarAdmins();
  }

  cargarAdmins() {
    this.loading = true;
    this.authService.obtenerAdministradores().subscribe({
      next: (res) => {
        this.admins = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar la lista de administradores.';
      }
    });
  }

  eliminarAdmin(id: number) {
    if (!confirm('¿Estás seguro de que deseas eliminar este administrador?')) return;

    this.loading = true;
    this.authService.eliminarAdministrador(id).subscribe({
      next: (res) => {
        this.success = res.mensaje || 'Administrador eliminado.';
        this.cargarAdmins();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.mensaje || 'Error al eliminar administrador.';
      }
    });
  }

  cambiarPassword(id: number) {
    const nuevaPassword = prompt('Ingresa la nueva contraseña para este administrador:');
    if (!nuevaPassword) return;

    this.loading = true;
    this.authService.cambiarPasswordAdmin(id, nuevaPassword).subscribe({
      next: (res) => {
        this.success = res.mensaje || 'Contraseña actualizada.';
        this.loading = false;
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.mensaje || 'Error al cambiar contraseña.';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
