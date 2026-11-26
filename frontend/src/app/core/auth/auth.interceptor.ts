import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionStore } from './session.store';

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/me', '/api/auth/change-password'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  const isAuthEndpoint = AUTH_ENDPOINTS.some((endpoint) => request.url.includes(endpoint));

  return next(request.clone({ withCredentials: true })).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        session.clear();
        void router.navigateByUrl('/login');
      }

      if (error.status === 403 && error.error?.error?.code === 'PASSWORD_CHANGE_REQUIRED') {
        session.mustChangePassword.set(true);
        void router.navigateByUrl('/cambiar-password');
      }

      return throwError(() => error);
    }),
  );
};
