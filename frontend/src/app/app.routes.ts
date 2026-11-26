import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { sessionGuard } from './core/auth/session.guard';
import { Shell } from './layout/shell';
import { ChangePasswordPage } from './pages/change-password-page';
import { ForbiddenPage } from './pages/forbidden-page';
import { HomePage } from './pages/home-page';
import { LoginPage } from './pages/login-page';
import { PlaceholderPage } from './pages/placeholder-page';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: '403', component: ForbiddenPage },
  { path: 'cambiar-password', component: ChangePasswordPage, canActivate: [sessionGuard] },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', component: HomePage },
      {
        path: 'ventas',
        component: PlaceholderPage,
        canActivate: [roleGuard],
        data: { roles: ['seller', 'admin'], title: 'Ventas' },
      },
      {
        path: 'historial',
        component: PlaceholderPage,
        canActivate: [roleGuard],
        data: { roles: ['seller'], title: 'Mi historial' },
      },
      {
        path: 'productos',
        component: PlaceholderPage,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'owner', 'warehouse_manager'], title: 'Productos' },
      },
      {
        path: 'stock',
        component: PlaceholderPage,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'owner', 'warehouse_manager'], title: 'Stock' },
      },
      {
        path: 'reportes',
        component: PlaceholderPage,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'owner'], title: 'Reportes' },
      },
      {
        path: 'usuarios',
        component: PlaceholderPage,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'owner'], title: 'Usuarios' },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
