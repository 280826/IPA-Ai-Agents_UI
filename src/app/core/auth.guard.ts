import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
// import { AuthService } from './auth.service';

export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // if (auth.isAuthenticated()) {
  if (auth.isLoggedIn()) {
    return true;
  }
  return router.parseUrl('/');
};
