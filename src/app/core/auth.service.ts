import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(null);
  readonly isAuthenticated = computed(() => !!this._token());

  login(email: string, password: string): Promise<boolean> {
    // Simulated async login. Replace with real API integration.
    return new Promise((resolve) => {
      setTimeout(() => {
        const ok = !!email && !!password;
        if (ok) {
          this._token.set('fake-jwt-token');
        }
        resolve(ok);
      }, 700);
    });
  }

  logout(): void {
    this._token.set(null);
  }

  get token(): string | null {
    return this._token();
  }
}
