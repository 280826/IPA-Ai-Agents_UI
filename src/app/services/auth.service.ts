import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }) {
    return this.http.post<{ ok: string, data: {accessToken: string, expiresIn: string} }>(
      `${environment.apiBaseUrl}/auth/login`,
      credentials
    ).pipe(
      tap(({ ok, data }) => ok && localStorage.setItem(this.tokenKey, data.accessToken))
    );
  }

  getToken(): string | null { return localStorage.getItem(this.tokenKey); }
  logout(): void { localStorage.removeItem(this.tokenKey); }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1]));
        if (payload && typeof payload.exp === 'number') {
          const now = Math.floor(Date.now() / 1000);
          return payload.exp > now;
        }
      } catch {}
    }
    return true;
  }
}
