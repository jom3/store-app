export type Role = 'admin' | 'owner' | 'warehouse_manager' | 'seller';

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
}

export interface SessionResponse {
  user: AuthUser;
  mustChangePassword: boolean;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  owner: 'Dueño',
  warehouse_manager: 'Encargado de almacén',
  seller: 'Vendedor',
};
