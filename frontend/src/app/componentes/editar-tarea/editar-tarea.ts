import { Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tarea } from '../../tarea/tarea';
import { TareasService } from '../../servicios/tareas.service';

@Component({
  selector: 'app-editar-tarea',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './editar-tarea.html',
  styleUrls: ['../nueva-tarea/nueva-tarea.css'],
})
export class EditarTarea implements OnInit {
  @Input({ required: true }) tarea!: any;
  @Output() cerrar = new EventEmitter<void>(); 

  tituloIngresado = '';
  resumenIngresado = '';
  fechaIngresado = '';

  tareasService = inject(TareasService);

  ngOnInit() {
    this.tituloIngresado = this.tarea.titulo;
    this.resumenIngresado = this.tarea.resumen;
    this.fechaIngresado = this.tarea.expira;
  }
   
  alCancelar() {
    this.cerrar.emit();
  }

  alEnviar() {
    const editada = {
      titulo: this.tituloIngresado, 
      resumen: this.resumenIngresado,
      expira: this.fechaIngresado,
    };

    this.tareasService.actualizarTarea(this.tarea.id, editada).subscribe({
      next: (respuesta) => {
        this.cerrar.emit();
      },
      error: (error) => {
        console.error('Hubo un error al editar la tarea:', error);
      }
    });
  }
}
