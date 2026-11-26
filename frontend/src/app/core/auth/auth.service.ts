import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Role, SessionResponse } from './auth.models';
import { SessionStore } from './session.store';

const HOME_BY_ROLE: Record<Role, string> = {
  admin: '/reportes',
  owner: '/reportes',
  warehouse_manager: '/productos',
  seller: '/ventas',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);
  private sessionChecked = false;

  readonly user = this.session.user;
  readonly mustChangePassword = this.session.mustChangePassword;

  login(username: string, password: string): Observable<SessionResponse> {
    return this.http
      .post<SessionResponse>('/api/auth/login', { username, password })
      .pipe(tap((response) => this.applySession(response)));
  }

  ensureSession(): Observable<boolean> {
    if (this.session.isAuthenticated()) {
      return of(true);
    }

    if (this.sessionChecked) {
      return of(false);
    }

    this.sessionChecked = true;

    return this.http.get<SessionResponse>('/api/auth/me').pipe(
      tap((response) => this.applySession(response)),
      map(() => true),
      catchError(() => {
        this.session.clear();
        return of(false);
      }),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<SessionResponse> {
    return this.http
      .post<SessionResponse>('/api/auth/change-password', { currentPassword, newPassword })
      .pipe(tap((response) => this.applySession(response)));
  }

  logout(): void {
    this.http.post<void>('/api/auth/logout', {}).subscribe({
      complete: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  homeUrl(role: Role): string {
    return HOME_BY_ROLE[role];
  }

  private applySession(response: SessionResponse): void {
    this.sessionChecked = true;
    this.session.set(response.user, response.mustChangePassword);
  }

  private finishLogout(): void {
    this.session.clear();
    this.sessionChecked = false;
    void this.router.navigateByUrl('/login');
  }
}
