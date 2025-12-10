import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, NgOptimizedImage],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  private auth = inject(AuthService);
  private router = inject(Router);

  async onLogin(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);

    try {
      const res = await firstValueFrom(
        this.auth.login({ email: this.email()!, password: this.password()! })
      );
      console.log('Login response:', res);

      if (res?.ok) {
        await this.router.navigateByUrl('/agents');
      } else {
        this.error.set('Invalid credentials. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Login failed', err);
      let message = 'Login failed';
      if (err instanceof HttpErrorResponse) {
        message = err.error?.message ?? err.message ?? message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = String((err as { message?: unknown }).message ?? message);
      } else if (typeof err === 'string') {
        message = err;
      }
      this.error.set(message);
    } finally {
      this.loading.set(false);
    }
  }
}
