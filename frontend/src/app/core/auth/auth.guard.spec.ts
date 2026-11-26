import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

const LOGIN_TREE = { target: 'login' } as unknown as UrlTree;
const CHANGE_PASSWORD_TREE = { target: 'change-password' } as unknown as UrlTree;

const runGuard = () =>
  TestBed.runInInjectionContext(() => authGuard({} as never, {} as never)) as Observable<
    boolean | UrlTree
  >;

describe('authGuard', () => {
  let authenticated: boolean;
  let mustChangePassword: boolean;

  beforeEach(() => {
    authenticated = true;
    mustChangePassword = false;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            ensureSession: () => of(authenticated),
            mustChangePassword: () => mustChangePassword,
          },
        },
        {
          provide: Router,
          useValue: {
            createUrlTree: (commands: string[]) =>
              commands[0] === '/login' ? LOGIN_TREE : CHANGE_PASSWORD_TREE,
          },
        },
      ],
    });
  });

  it('allows an authenticated user', async () => {
    expect(await firstValueFrom(runGuard())).toBe(true);
  });

  it('redirects an unauthenticated user to login', async () => {
    authenticated = false;

    expect(await firstValueFrom(runGuard())).toBe(LOGIN_TREE);
  });

  it('redirects a user that must change the password', async () => {
    mustChangePassword = true;

    expect(await firstValueFrom(runGuard())).toBe(CHANGE_PASSWORD_TREE);
  });
});
