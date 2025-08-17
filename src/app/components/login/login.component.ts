import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  email = ''; password = ''; showPassword = false; loading = false;

  constructor(private router: Router, private api: ApiService, private auth: AuthService) {}

  togglePassword(){ this.showPassword = !this.showPassword; }

  login() {
    if (!this.email || !this.password) { alert('Enter email & password'); return; }
    this.loading = true;
    this.api.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        // backend must return { access_token, email }
        this.auth.loginSuccess(res.access_token, res.email || this.email);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => alert(err?.error?.error || 'Login failed'),
      complete: () => this.loading = false
    });
  }
}
