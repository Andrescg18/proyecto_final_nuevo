import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  @Output() close = new EventEmitter<void>();

  constructor(private authService: AuthService) {}

  onLogin() {
    this.error = '';
    this.loading = true;
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.close.emit();
      },
      error: (err) => {
        this.loading = false;
        const targetUrl = 'https://evidence-management-backend.onrender.com';
        this.error = (err.error?.mensaje || 'Error al iniciar sesión') + ' (Conectando a Render Backend)';
        console.error('Fallo en login hacia:', targetUrl, err);
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
