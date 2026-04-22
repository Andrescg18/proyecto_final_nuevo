import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Tarjeta } from '../componentes/tarjeta/tarjeta';
import { TareasService } from '../servicios/tareas.service';
import { AuthService } from '../servicios/auth.service';

@Component({
  selector: 'app-tarea',
  standalone: true,
  imports: [CommonModule, Tarjeta, DatePipe],
  templateUrl: './tarea.html',
  styleUrl: './tarea.css',
})
export class Tarea {
  @Input({required: true}) tarea!: any;
  
  @Output() completar = new EventEmitter<number>(); 
  @Output() eliminar = new EventEmitter<number>(); 
  @Output() editar = new EventEmitter<any>();

  tareasService = inject(TareasService);
  authService = inject(AuthService);

  alEditarTarea() {
    this.editar.emit(this.tarea);
  }

  alCompletarTarea() {
    this.tareasService.actualizarTarea(this.tarea.id, { completada: true }).subscribe({
      next: () => {
        this.completar.emit(this.tarea.id);
      },
      error: (err) => console.error('Error al completar:', err)
    });
  }

  alReabrirTarea() {
    this.tareasService.actualizarTarea(this.tarea.id, { completada: false }).subscribe({
      next: () => {
        this.completar.emit(this.tarea.id);
      },
      error: (err) => console.error('Error al reabrir:', err)
    });
  }

  alEliminarTarea() {
    this.tareasService.eliminarTarea(this.tarea.id).subscribe({
      next: () => {
        this.eliminar.emit(this.tarea.id);
      },
      error: (err) => console.error('Error al eliminar:', err)
    });
  }
}