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
    console.log('[NUEVA TAREA] Intentando crear para usuario:', this.idUsuario);
    
    const nuevaTarea = {
      titulo: this.tituloIngresado, 
      resumen: this.resumenIngresado,
      fecha: this.fechaIngresado, 
      idUsuario: this.idUsuario
    };

    this.tareasService.crearTarea(nuevaTarea as any).subscribe({
      next: (respuesta) => {
        console.log('[NUEVA TAREA] Respuesta del servidor:', respuesta);
        alert('✅ ¡Tarea guardada con éxito!');
        this.cerrar.emit();
      },
      error: (error) => {
        console.error('[NUEVA TAREA] Error al guardar:', error);
        alert('❌ Error al guardar la tarea. Revisa la consola para más detalles.');
      }
    });
  }
}