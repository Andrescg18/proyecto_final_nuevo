import { Component, EventEmitter, Input, Output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Usuario } from '../../servicios/usuarios.service';

export type ModoGestion = 'crear' | 'editar' | 'borrar';

@Component({
  selector: 'app-gestion-persona',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-persona.html',
  styleUrl: './gestion-persona.css'
})
export class GestionPersonaComponent implements OnInit {
  @Input() modo: ModoGestion = 'crear';
  @Input() usuario?: Usuario;
  @Output() cerrar = new EventEmitter<void>();
  @Output() completado = new EventEmitter<void>();

  usuariosService = inject(UsuariosService);
  
  nombre = signal('');
  avatarSeleccionado = signal('');
  catalogo = signal<string[]>([]);
  cargando = signal(false);

  ngOnInit() {
    this.usuariosService.obtenerCatalogo().subscribe(res => {
      this.catalogo.set(res);
      if (this.modo === 'editar' && this.usuario) {
        this.nombre.set(this.usuario.nombre);
        this.avatarSeleccionado.set(this.usuario.avatar);
      } else if (res.length > 0) {
        this.avatarSeleccionado.set(res[0]);
      }
    });
  }

  seleccionarAvatar(url: string) {
    if (this.modo === 'borrar') return;
    this.avatarSeleccionado.set(url);
  }

  guardar() {
    if (this.modo !== 'borrar' && !this.nombre().trim()) return;
    
    this.cargando.set(true);
    let obs$;

    if (this.modo === 'crear') {
      obs$ = this.usuariosService.crearUsuario(this.nombre(), this.avatarSeleccionado());
    } else if (this.modo === 'editar' && this.usuario) {
      obs$ = this.usuariosService.editarPerfil(this.usuario.id, this.nombre(), this.avatarSeleccionado());
    } else if (this.modo === 'borrar' && this.usuario) {
      obs$ = this.usuariosService.eliminarUsuario(this.usuario.id);
    }

    if (obs$) {
      obs$.subscribe({
        next: () => {
          this.completado.emit();
          this.cerrar.emit();
        },
        error: (err) => {
          alert(err.error?.mensaje || 'Error en la operación');
          this.cargando.set(false);
        }
      });
    }
  }

  cancelar() {
    this.cerrar.emit();
  }
}
