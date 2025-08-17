import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  email = '';
  password = '';
  showPassword = false;
  loading = false;

  constructor(private router: Router, private api: ApiService) {}

  togglePassword() { this.showPassword = !this.showPassword; }

  private toast(msg: string) { window.alert(msg); }

  register() {
    if (!this.email || !this.password) {
      this.toast('Please enter both email and password.');
      return;
    }

    this.loading = true;
    const data = { email: this.email.trim().toLowerCase(), password: this.password };

    this.api.register(data).subscribe({
      next: () => {
        this.loading = false;
        this.toast('✅ Registration successful! Please log in.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {              // <-- typed
        this.loading = false;
        console.error('Registration failed:', err);
        this.toast(err?.error?.error || 'Registration failed.');
      }
    });

    // optional: clear fields
    this.email = '';
    this.password = '';
  }
}
