import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  loading = signal(false);
  error = signal<string | null>(null);

  private auth = inject(AuthService);
  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.auth.initialize();
    if (this.auth.isLoggedIn()) {
      await this.router.navigateByUrl('/agents');
    }
  }

  async onMicrosoftLogin(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    try {
      await this.auth.login();
      await this.router.navigateByUrl('/agents');
    } catch (err: unknown) {
      console.error('Microsoft sign-in failed', err);
      this.error.set(err instanceof Error ? err.message : 'Microsoft sign-in failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
