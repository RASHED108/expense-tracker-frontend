// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  showPassword = false;
  loading = false;

  constructor(
    private router: Router,
    private api: ApiService,
    private auth: AuthService
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    const email = this.email.trim();
    const password = this.password;

    if (!email || !password) {
      alert('Enter email & password');
      return;
    }

    this.loading = true;

    this.api
      .login({ email, password })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          // backend may return { access_token } or { token }
          const token = res.access_token ?? res.token ?? '';
          if (!token) {
            alert(res.message ?? 'Login failed');
            return;
          }

          // Prefer server-provided email if present
          this.auth.loginSuccess(token, res.email ?? email);
          this.router.navigateByUrl('/dashboard');
        },
        error: (err) => {
          const msg =
            err?.error?.message ??
            err?.error?.error ??
            'Login failed';
          alert(msg);
        }
      });
  }
}
