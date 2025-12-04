import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'agents',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./features/agents/agents.component').then((m) => m.AgentsComponent),
  },
  { path: '', redirectTo: 'agents', pathMatch: 'full' },
  { path: '**', redirectTo: 'agents' },
];
