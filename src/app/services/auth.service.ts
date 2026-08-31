import { Injectable } from '@angular/core';
import {
  AccountInfo,
  AuthenticationResult,
  BrowserCacheLocation,
  PublicClientApplication,
} from '@azure/msal-browser';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'auth_token';
  private readonly msal = new PublicClientApplication({
    auth: {
      clientId: environment.msal.clientId,
      authority: `https://login.microsoftonline.com/${environment.msal.tenantId}`,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: { cacheLocation: BrowserCacheLocation.LocalStorage },
  });
  private initialization?: Promise<void>;

  async initialize(): Promise<void> {
    if (!this.initialization) this.initialization = this.initializeMsal();
    return this.initialization;
  }

  async login(): Promise<void> {
    this.ensureConfigured();
    await this.initialize();
    await this.msal.loginRedirect({
      scopes: ['openid', 'profile', 'email', ...environment.msal.apiScopes],
      prompt: 'select_account',
    });
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private async initializeMsal(): Promise<void> {
    this.ensureConfigured();
    await this.msal.initialize();
    const result = await this.msal.handleRedirectPromise();
    const account = result?.account ?? this.msal.getActiveAccount() ?? this.msal.getAllAccounts()[0];
    if (account) {
      this.msal.setActiveAccount(account);
      await this.refreshAccessToken(account, result?.accessToken);
    }
  }

  private async setSession(result: AuthenticationResult): Promise<void> {
    if (!result.account) throw new Error('Microsoft sign-in did not return an account.');
    this.msal.setActiveAccount(result.account);
    await this.refreshAccessToken(result.account, result.accessToken);
  }

  private async refreshAccessToken(account: AccountInfo, token?: string): Promise<void> {
    const accessToken = token || (await this.msal.acquireTokenSilent({
      account,
      scopes: environment.msal.apiScopes,
    })).accessToken;
    localStorage.setItem(this.tokenKey, accessToken);
  }

  private ensureConfigured(): void {
    if (
      environment.msal.clientId.startsWith('YOUR_') ||
      environment.msal.tenantId.startsWith('YOUR_') ||
      environment.msal.apiScopes.some((scope) => scope.includes('YOUR_'))
    ) {
      throw new Error('Microsoft Entra SSO is not configured. Set clientId, tenantId, and apiScopes in the active environment file.');
    }
  }
}
