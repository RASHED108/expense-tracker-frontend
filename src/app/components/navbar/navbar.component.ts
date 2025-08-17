import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent {
  isLoggedIn$!: Observable<boolean>;
  userEmail: string | null = null;

  constructor(private authService: AuthService, private router: Router) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.userEmail = this.authService.email;
    this.isLoggedIn$.subscribe(() => this.userEmail = this.authService.email);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
