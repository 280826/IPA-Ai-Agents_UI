import { ApplicationConfig, Provider } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),

    provideHttpClient(withInterceptorsFromDi()), // enable DI interceptors
    // register the DI interceptor
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true } as Provider,
  ],
};
