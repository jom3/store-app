import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { Role } from './auth.models';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data['roles'] as Role[] | undefined) ?? [];

  return auth.ensureSession().pipe(
    map((authenticated) => {
      if (!authenticated) {
        return router.createUrlTree(['/login']);
      }

      const role = auth.user()?.role;
      if (!role || !allowedRoles.includes(role)) {
        return router.createUrlTree(['/403']);
      }

      return true;
    }),
  );
};
