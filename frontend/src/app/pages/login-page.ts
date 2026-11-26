import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { ApiError } from '../core/http/api-error';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  template: `
    <main class="auth-page">
      <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>Sistema de ventas</h1>
        <p class="muted">Ingresá con tu usuario y contraseña.</p>

        @if (errorMessage()) {
          <p class="error" role="alert">{{ errorMessage() }}</p>
        }

        <label>
          Usuario
          <input formControlName="username" autocomplete="username" />
        </label>
        @if (form.controls.username.touched && form.controls.username.invalid) {
          <span class="field-error">Ingresá tu usuario.</span>
        }

        <label>
          Contraseña
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <span class="field-error">Ingresá tu contraseña.</span>
        }

        <button type="submit" [disabled]="submitting()">
          {{ submitting() ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>
    </main>
  `,
  styles: [
    `
      .auth-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f1f5f9;
        padding: 1.5rem;
      }

      .auth-card {
        width: min(22rem, 100%);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        background: #fff;
        padding: 2rem;
        border-radius: 0.75rem;
        box-shadow: 0 12px 32px rgb(15 23 42 / 12%);
      }

      h1 {
        margin: 0;
        font-size: 1.4rem;
      }

      label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-weight: 600;
      }

      input {
        padding: 0.55rem 0.7rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.4rem;
        font: inherit;
      }

      button {
        margin-top: 0.5rem;
        padding: 0.6rem;
        border: 0;
        border-radius: 0.4rem;
        background: #1d4ed8;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.6;
        cursor: progress;
      }

      .muted {
        margin: 0;
        color: #475569;
        font-size: 0.9rem;
      }

      .error {
        margin: 0;
        padding: 0.5rem 0.7rem;
        border-radius: 0.4rem;
        background: #fee2e2;
        color: #991b1b;
        font-size: 0.9rem;
      }

      .field-error {
        color: #b91c1c;
        font-size: 0.8rem;
      }
    `,
  ],
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  constructor() {
    this.auth.ensureSession().subscribe((authenticated) => {
      const user = this.auth.user();
      if (authenticated && user) {
        void this.router.navigateByUrl(this.auth.homeUrl(user.role));
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.errorMessage.set(null);
    this.submitting.set(true);

    this.auth.login(username, password).subscribe({
      next: (response) => {
        const target = response.mustChangePassword
          ? '/cambiar-password'
          : this.auth.homeUrl(response.user.role);
        void this.router.navigateByUrl(target);
      },
      error: (error: ApiError) => {
        this.errorMessage.set(error.message);
        this.submitting.set(false);
      },
    });
  }
}
