import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '../http/api-error';
import { errorInterceptor } from '../http/error.interceptor';
import { authInterceptor } from './auth.interceptor';
import { SessionStore } from './session.store';

describe('http interceptors', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let session: SessionStore;
  const navigations: string[] = [];

  const flushError = async (url: string, status: number, body: object) => {
    const pending = firstValueFrom(http.get(url)).catch((error: unknown) => error);
    const request = httpMock.expectOne(url);
    expect(request.request.withCredentials).toBe(true);
    request.flush(body, { status, statusText: 'Error' });
    return pending;
  };

  beforeEach(() => {
    navigations.length = 0;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: {
            navigateByUrl: (url: string) => {
              navigations.push(url);
              return Promise.resolve(true);
            },
          },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => httpMock.verify());

  it('sends cookies and logs out on a 401 from a protected route', async () => {
    const error = await flushError('/api/products', 401, {
      error: { code: 'UNAUTHENTICATED', message: 'Debés iniciar sesión.' },
    });

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe('Debés iniciar sesión.');
    expect(navigations).toEqual(['/login']);
    expect(session.isAuthenticated()).toBe(false);
  });

  it('redirects to the password change page when the API requires it', async () => {
    await flushError('/api/products', 403, {
      error: { code: 'PASSWORD_CHANGE_REQUIRED', message: 'Cambiá tu contraseña.' },
    });

    expect(navigations).toEqual(['/cambiar-password']);
    expect(session.mustChangePassword()).toBe(true);
  });

  it('does not redirect on a failed login', async () => {
    await flushError('/api/auth/login', 401, {
      error: { code: 'INVALID_CREDENTIALS', message: 'Usuario o contraseña incorrectos.' },
    });

    expect(navigations).toEqual([]);
  });
});
