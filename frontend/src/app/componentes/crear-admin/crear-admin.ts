import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-crear-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-admin.html',
  styleUrls: ['../login/login.css'] // Reusing login styles
})
export class CrearAdminComponent {
  newUsername = '';
  newPassword = '';
  error = '';
  success = '';
  loading = false;

  @Output() close = new EventEmitter<void>();

  authService = inject(AuthService);

  onCreate() {
    this.error = '';
    this.success = '';
    
    if (!this.newUsername || !this.newPassword) {
      this.error = 'Debes ingresar un nombre de usuario y contraseña.';
      return;
    }

    this.loading = true;
    this.authService.crearAdministrador(this.newUsername, this.newPassword).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.mensaje || 'Administrador creado con éxito.';
        setTimeout(() => this.close.emit(), 1500); 
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.mensaje || 'Error al crear el administrador';
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
