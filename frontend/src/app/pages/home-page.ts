import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-home-page',
  template: '',
})
export class HomePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      void this.router.navigateByUrl(this.auth.homeUrl(user.role));
    }
  }
}
