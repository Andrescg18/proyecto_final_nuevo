import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Encabezado } from "./componentes/encabezado/encabezado";
import { Usuario } from './componentes/usuario/usuario';
import { Tareas } from './componentes/tareas/tareas';
import { LoginComponent } from './componentes/login/login';
import { AuthService } from './servicios/auth.service';
import { UsuariosService, Usuario as UsuarioInterface } from './servicios/usuarios.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Encabezado, Usuario, Tareas, LoginComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('proyecto_inicial');
  
  // -- Signals para estado Reactivo (RF-07) --
  usuarios = signal<UsuarioInterface[]>([]);
  idUsuarioSeleccionado = signal<string | undefined>(undefined);
  
  // -- Modales y Catálogo (RF-05, RNF-02) --
  showLoginModal = signal(false);
  showAvatarModal = signal(false);
  catalogo = signal<string[]>([]);
  
  // Estado temporal para creación
  nuevoNombreTmp = '';

  authService = inject(AuthService);
  usuariosService = inject(UsuariosService);

  usuarioSeleccionado = computed(() => 
    this.usuarios().find((u) => u.id === this.idUsuarioSeleccionado())
  );

  ngOnInit() {
    this.cargarUsuarios();
    this.usuariosService.obtenerCatalogo().subscribe(res => this.catalogo.set(res));
  }

  cargarUsuarios() {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (res) => this.usuarios.set(res),
      error: (err) => console.error('Error al cargar usuarios:', err)
    });
  }

  abrirCrearUsuario() {
    const nombre = prompt('¿Cómo se llama la nueva persona?');
    if (!nombre) return;
    this.nuevoNombreTmp = nombre;
    this.showAvatarModal.set(true);
  }

  seleccionarAvatarYCrear(url: string) {
    this.usuariosService.crearUsuario(this.nuevoNombreTmp, url).subscribe({
      next: () => {
        this.showAvatarModal.set(false);
        this.cargarUsuarios();
        this.nuevoNombreTmp = '';
      },
      error: (err) => alert(err.error?.mensaje || 'Error al crear')
    });
  }

  alSeleccionarUsuario(id: string) {
    this.idUsuarioSeleccionado.set(id);
  }

  limpiarSeleccion() {
    this.idUsuarioSeleccionado.set(undefined);
  }
}
