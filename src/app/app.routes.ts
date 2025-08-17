import { Routes } from '@angular/router';
import { authGuard } from './auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'add-transaction',
    loadComponent: () =>
      import('./components/add-transaction/add-transaction.component')
        .then(m => m.AddTransactionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./components/transactions/transactions.component')
        .then(m => m.TransactionsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component') // ✅ Corrected filename
        .then(m => m.RegisterComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
