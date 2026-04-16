import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tarea } from "../../tarea/tarea";
import { NuevaTarea } from "../nueva-tarea/nueva-tarea";
import { EditarTarea } from "../editar-tarea/editar-tarea";
import { TareasService } from '../../servicios/tareas.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, Tarea, NuevaTarea, EditarTarea],
  templateUrl: './tareas.html',
  styleUrl: './tareas.css',
})
export class Tareas implements OnChanges {
  @Input({required: true}) nombre!: string;
  @Input({ required: true }) idUsuario!: string;
  
  estaAgregandoTareaNueva = false;
  tareaEnEdicion: any = null;
  
  tareasUsuarioSeleccionado: any[] = []; 

  tareasService = inject(TareasService);
  authService = inject(AuthService);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idUsuario']) {
      this.cargarTareas();
    }
  }

  cargarTareas() {
    this.tareasService.obtenerTareasPorUsuario(this.idUsuario).subscribe({
      next: (datos) => {
        this.tareasUsuarioSeleccionado = datos;
      },
      error: (err) => {
        console.error('Error al traer las tareas:', err);
      }
    });
  }

  alIniciarNuevaTarea() {
    this.estaAgregandoTareaNueva = true;
  }

  alCerrarTareaNueva() {
    this.estaAgregandoTareaNueva = false;
    this.cargarTareas(); 
  }

  alIniciarEditarTarea(tarea: any) {
    this.tareaEnEdicion = tarea;
  }

  alCerrarEditarTarea() {
    this.tareaEnEdicion = null;
    this.cargarTareas();
  }
}