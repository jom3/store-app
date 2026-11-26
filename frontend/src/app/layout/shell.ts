import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ROLE_LABELS, Role } from '../core/auth/auth.models';
import { AuthService } from '../core/auth/auth.service';

interface NavItem {
  path: string;
  label: string;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/ventas', label: 'Ventas', roles: ['seller', 'admin'] },
  { path: '/historial', label: 'Mi historial', roles: ['seller'] },
  {
    path: '/productos',
    label: 'Productos',
    roles: ['admin', 'owner', 'warehouse_manager'],
  },
  { path: '/stock', label: 'Stock', roles: ['admin', 'owner', 'warehouse_manager'] },
  { path: '/reportes', label: 'Reportes', roles: ['admin', 'owner'] },
  { path: '/usuarios', label: 'Usuarios', roles: ['admin', 'owner'] },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });
  readonly items = computed(() => {
    const role = this.user()?.role;
    return role ? NAV_ITEMS.filter((item) => item.roles.includes(role)) : [];
  });

  logout(): void {
    this.auth.logout();
  }
}
