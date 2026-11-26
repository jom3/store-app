import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { Role } from './auth.models';
import { AuthService } from './auth.service';
import { roleGuard } from './role.guard';

const LOGIN_TREE = { target: 'login' } as unknown as UrlTree;
const FORBIDDEN_TREE = { target: 'forbidden' } as unknown as UrlTree;

const runGuard = (roles: Role[]) =>
  TestBed.runInInjectionContext(() =>
    roleGuard({ data: { roles } } as never, {} as never),
  ) as Observable<boolean | UrlTree>;

describe('roleGuard', () => {
  let role: Role | null;
  let authenticated: boolean;

  beforeEach(() => {
    role = 'seller';
    authenticated = true;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            ensureSession: () => of(authenticated),
            user: () => (role ? { id: 1, username: 'vendedor', role } : null),
          },
        },
        {
          provide: Router,
          useValue: {
            createUrlTree: (commands: string[]) =>
              commands[0] === '/login' ? LOGIN_TREE : FORBIDDEN_TREE,
          },
        },
      ],
    });
  });

  it('allows a role listed in the route data', async () => {
    expect(await firstValueFrom(runGuard(['seller', 'admin']))).toBe(true);
  });

  it('redirects a role not listed in the route data', async () => {
    expect(await firstValueFrom(runGuard(['admin', 'owner']))).toBe(FORBIDDEN_TREE);
  });

  it('redirects an unauthenticated user to login', async () => {
    authenticated = false;

    expect(await firstValueFrom(runGuard(['seller']))).toBe(LOGIN_TREE);
  });
});
