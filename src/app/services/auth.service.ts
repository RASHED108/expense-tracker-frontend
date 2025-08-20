import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'access_token';
  private emailKey = 'user_email';

  private loggedIn$ = new BehaviorSubject<boolean>(!!localStorage.getItem(this.tokenKey));
  readonly isLoggedIn$ = this.loggedIn$.asObservable();

  get token(): string | null { return localStorage.getItem(this.tokenKey); }
  get email(): string | null { return localStorage.getItem(this.emailKey); }

  // call after /auth/login succeeds
  loginSuccess(token: string, email: string) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.emailKey, email);

    
    localStorage.setItem('isLoggedIn', 'true');

    this.loggedIn$.next(true);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.emailKey);
    localStorage.removeItem('isLoggedIn'); // clear flag on logout
    this.loggedIn$.next(false);
  }

  getCurrentUser(): string | null { return this.email; }
}
