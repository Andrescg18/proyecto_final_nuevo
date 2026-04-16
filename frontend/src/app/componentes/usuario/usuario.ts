import { Component, computed, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { type Usuarios } from './usuario.model';
import { Tarjeta } from "../tarjeta/tarjeta";
import { AuthService } from '../../servicios/auth.service';
import { UsuariosService } from '../../servicios/usuarios.service';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [Tarjeta, CommonModule],
  templateUrl: './usuario.html',
  styleUrl: './usuario.css',
})
export class Usuario {
  
  @Input({ required: true }) usuario!: Usuarios ;
  @Input({ required: true }) seleccionado!: boolean ;
  @Output() seleccion = new EventEmitter();
  @Output() usuarioEditado = new EventEmitter();

  authService = inject(AuthService);
  usuariosService = inject(UsuariosService);

  get rutaImagen() {
    return 'img/' + this.usuario.avatar;
  }

  alSeleccionarUsuario() {
    this.seleccion.emit(this.usuario.id);
  }

  alEditarUsuario(event: Event) {
    event.stopPropagation();
    const nuevoNombre = prompt(`Cambiar nombre de ${this.usuario.nombre}:`, this.usuario.nombre);
    if (!nuevoNombre || nuevoNombre === this.usuario.nombre) return;

    this.usuariosService.editarPerfil(this.usuario.id, nuevoNombre).subscribe({
      next: () => this.usuarioEditado.emit(),
      error: (err) => alert(err.error?.mensaje || 'Error al actualizar')
    });
  }

  alEliminarUsuario(event: Event) {
    event.stopPropagation();
    if (!confirm(`¿Estás seguro de eliminar a ${this.usuario.nombre}? Esto borrará todas sus tareas permanentemente (Eliminación en Cascada).`)) return;

    this.usuariosService.eliminarUsuario(this.usuario.id).subscribe({
      next: () => {
        alert('Usuario eliminado correctamente.');
        this.usuarioEditado.emit();
      },
      error: (err) => alert(err.error?.mensaje || 'Error al eliminar usuario')
    });
  }
}