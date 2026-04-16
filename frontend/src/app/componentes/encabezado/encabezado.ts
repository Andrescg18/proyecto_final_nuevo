import { Component, EventEmitter, Output, inject } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { CrearAdminComponent } from '../crear-admin/crear-admin';
import { EditarPerfilComponent } from '../editar-perfil/editar-perfil';
import { GestionarAdminsComponent } from '../gestionar-admins/gestionar-admins';

@Component({
  selector: 'app-encabezado',
  standalone: true,
  imports: [CommonModule, CrearAdminComponent, EditarPerfilComponent, GestionarAdminsComponent],
  templateUrl: './encabezado.html',
  styleUrl: './encabezado.css',
})
export class Encabezado {
  @Output() logoClick = new EventEmitter<void>();
  @Output() openLogin = new EventEmitter<void>();

  authService = inject(AuthService);
  
  showCrearAdminModal = false;
  showEditarPerfilModal = false;
  showGestionarAdminsModal = false;

  onLogoClick() {
    this.logoClick.emit();
  }

  onLoginClick() {
    this.openLogin.emit();
  }

  onLogoutClick() {
    this.authService.logout();
  }

}