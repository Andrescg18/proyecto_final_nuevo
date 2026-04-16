import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-perfil.html',
  styleUrls: ['../login/login.css'] // Reusing login styles for consistency
})
export class EditarPerfilComponent {
  newUsername = '';
  newPassword = '';
  error = '';
  success = '';
  loading = false;

  @Output() close = new EventEmitter<void>();

  authService = inject(AuthService);

  onUpdate() {
    this.error = '';
    this.success = '';
    
    if (!this.newUsername && !this.newPassword) {
      this.error = 'Debes ingresar al menos un dato para actualizar.';
      return;
    }

    this.loading = true;
    this.authService.editarPerfil(this.newUsername, this.newPassword).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = (res.mensaje || 'Perfil actualizado.') + ' Cerrando sesión para aplicar cambios...';
        setTimeout(() => {
          this.authService.logout();
          this.close.emit();
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.mensaje || 'Error al actualizar perfil';
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
