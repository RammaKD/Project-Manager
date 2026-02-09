import { Component, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  currentUser: User | null = null;
  isOpen = input(true);
  hasToken = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.updateTokenState();
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.updateTokenState();
    });
  }

  updateTokenState(): void {
    this.hasToken = !!this.authService.getToken();
  }

  logout(): void {
    this.authService.logout();
    this.updateTokenState();
  }
}

