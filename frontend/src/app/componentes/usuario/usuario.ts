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
  @Output() seleccion = new EventEmitter<string>();
  @Output() editar = new EventEmitter<Usuarios>();
  @Output() eliminar = new EventEmitter<Usuarios>();

  authService = inject(AuthService);

  alSeleccionarUsuario() {
    this.seleccion.emit(this.usuario.id);
  }

  alEditarUsuario(event: Event) {
    event.stopPropagation();
    this.editar.emit(this.usuario);
  }

  alEliminarUsuario(event: Event) {
    event.stopPropagation();
    this.eliminar.emit(this.usuario);
  }
}