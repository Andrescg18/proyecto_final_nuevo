import { Component, Input, OnChanges, SimpleChanges, inject, signal, ChangeDetectorRef } from '@angular/core';
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
  
  // Usamos una señal para reactividad máxima (RF-07)
  tareasUsuarioSeleccionado = signal<any[]>([]); 

  tareasService = inject(TareasService);
  authService = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idUsuario']) {
      this.tareasUsuarioSeleccionado.set([]);
      this.cargarTareas();
    }
  }

  cargarTareas() {
    console.log('[TAREAS] Cargando lista para:', this.idUsuario);
    this.tareasService.obtenerTareasPorUsuario(this.idUsuario).subscribe({
      next: (datos) => {
        this.tareasUsuarioSeleccionado.set(datos);
        this.cdr.detectChanges(); // Forzamos el refresco de la UI (RF-07)
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
    // Forzamos la carga y el redibujado de la sección
    this.cargarTareas();
    this.cdr.detectChanges();
  }

  alIniciarEditarTarea(tarea: any) {
    this.tareaEnEdicion = tarea;
  }

  alCerrarEditarTarea() {
    this.tareaEnEdicion = null;
    this.cargarTareas();
  }
}