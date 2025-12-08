import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { AgentDetailComponent } from './features/agents/agent-details/agent-details.component';

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

    children: [{ path: ':id', component: AgentDetailComponent }],
  },
  { path: '', redirectTo: 'agents', pathMatch: 'full' },
  { path: '**', redirectTo: 'agents' },
];
