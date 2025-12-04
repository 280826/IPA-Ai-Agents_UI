import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// Material modules removed — using native inputs and buttons for this layout
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  async onLogin(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    const ok = await this.auth.login(this.email(), this.password());
    this.loading.set(false);
    if (ok) {
      this.router.navigateByUrl('/agents');
    } else {
      this.error.set('Invalid credentials. Please try again.');
    }
  }
}
