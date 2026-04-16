import { Component, signal, inject, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Encabezado } from "./componentes/encabezado/encabezado";
import { Usuario } from './componentes/usuario/usuario';
import { Tareas } from './componentes/tareas/tareas';
import { LoginComponent } from './componentes/login/login';
import { GestionPersonaComponent, ModoGestion } from './componentes/gestion-persona/gestion-persona';
import { AuthService } from './servicios/auth.service';
import { UsuariosService, Usuario as UsuarioInterface } from './servicios/usuarios.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Encabezado, Usuario, Tareas, LoginComponent, GestionPersonaComponent],
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
  showGestionModal = signal(false);
  modoGestion = signal<ModoGestion>('crear');
  usuarioParaGestion = signal<UsuarioInterface | undefined>(undefined);
  
  authService = inject(AuthService);
  usuariosService = inject(UsuariosService);

  usuarioSeleccionado = computed(() => 
    this.usuarios().find((u) => u.id === this.idUsuarioSeleccionado())
  );

  constructor() {
    // Escucha cambios en la sesión para detectar expiración (RNF-04)
    effect(() => {
      if (!this.authService.isAdmin() && this.showGestionModal()) {
        this.showGestionModal.set(false); // Cerramos el modal de gestión roto
        this.showLoginModal.set(true); // Pedimos login
        console.warn('Sesión expirada detectada. Redirigiendo a login...');
      }
    });
  }

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (res) => {
        this.usuarios.set(res);
        // Si el usuario seleccionado ya no existe (fue borrado), limpiamos
        if (this.idUsuarioSeleccionado() && !res.find(u => u.id === this.idUsuarioSeleccionado())) {
          this.idUsuarioSeleccionado.set(undefined);
        }
      },
      error: (err) => console.error('Error al cargar usuarios:', err)
    });
  }

  abrirGestion(modo: ModoGestion, usuario?: UsuarioInterface) {
    if (!this.authService.isAdmin()) {
      this.showLoginModal.set(true);
      return;
    }
    this.modoGestion.set(modo);
    this.usuarioParaGestion.set(usuario);
    this.showGestionModal.set(true);
  }

  alSeleccionarUsuario(id: string) {
    this.idUsuarioSeleccionado.set(id);
  }

  limpiarSeleccion() {
    this.idUsuarioSeleccionado.set(undefined);
  }
}
