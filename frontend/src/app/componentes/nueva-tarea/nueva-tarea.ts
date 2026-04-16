import { Component, EventEmitter, inject, Input, Output} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TareasService } from '../../servicios/tareas.service';

@Component({
  selector: 'app-nueva-tarea',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './nueva-tarea.html',
  styleUrl: './nueva-tarea.css',
})
export class NuevaTarea {
  @Input({ required: true }) idUsuario!: string;
  @Output() cerrar = new EventEmitter<void>(); 

  tituloIngresado = '';
  resumenIngresado = '';
  fechaIngresado = '';

  tareasService = inject(TareasService);
   
  alCancelar() {
    this.cerrar.emit();
  }

  alEnviar() {
    const nuevaTarea = {
      titulo: this.tituloIngresado, 
      resumen: this.resumenIngresado,
      fecha: this.fechaIngresado, // backend index.js is looking for const { ..., fecha, ... } = req.body
      idUsuario: this.idUsuario
    };

    this.tareasService.crearTarea(nuevaTarea as any).subscribe({
      next: (respuesta) => {
        this.cerrar.emit();
      },
      error: (error) => {
        console.error('Hubo un error al guardar la tarea:', error);
      }
    });
  }
}