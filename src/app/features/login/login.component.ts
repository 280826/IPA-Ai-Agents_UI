import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
// Material modules removed — using native inputs and buttons for this layout
// import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
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
    // // local testing hack
    // // const ok = await this.auth.login(this.email(), this.password());
    // const ok = await this.auth.login({ username: this.email()!, password: this.password()! });
    // this.loading.set(false);
    // if (ok) {
    //   this.router.navigateByUrl('/agents');
    // } else {
    //   this.error.set('Invalid credentials. Please try again.');
    // }

    try {
      const res = await firstValueFrom(
        this.auth.login({ email: this.email()!, password: this.password()! })
      );
      console.log('Login response:', res);

      // res is { token: string } based on your service method
      if (res?.ok) {
        this.router.navigateByUrl('/agents');
      } else {
        // this.error.set(res.message);
        this.error.set('Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      console.error('Login failed', err);
      this.error.set(err.error?.message || 'Login failed');
      // this.error.set('Invalid credentials. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
