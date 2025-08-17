// src/app/auth-guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.token) return true; // uses 'access_token' from AuthService

  router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
  return false;
};
