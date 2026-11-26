import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { ApiError } from '../core/http/api-error';

const passwordsMatch = (control: AbstractControl): ValidationErrors | null =>
  control.value.confirmPassword === control.value.newPassword ? null : { passwordsMismatch: true };

@Component({
  selector: 'app-change-password-page',
  imports: [ReactiveFormsModule],
  template: `
    <main class="auth-page">
      <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>Cambiar contraseña</h1>
        <p class="muted">Por seguridad, definí una contraseña nueva antes de continuar.</p>

        @if (errorMessage()) {
          <p class="error" role="alert">{{ errorMessage() }}</p>
        }

        <label>
          Contraseña actual
          <input type="password" formControlName="currentPassword" autocomplete="current-password" />
        </label>

        <label>
          Contraseña nueva
          <input type="password" formControlName="newPassword" autocomplete="new-password" />
        </label>
        @if (form.controls.newPassword.touched && form.controls.newPassword.invalid) {
          <span class="field-error">La contraseña debe tener al menos 8 caracteres.</span>
        }

        <label>
          Repetir contraseña nueva
          <input type="password" formControlName="confirmPassword" autocomplete="new-password" />
        </label>
        @if (form.hasError('passwordsMismatch') && form.controls.confirmPassword.touched) {
          <span class="field-error">Las contraseñas no coinciden.</span>
        }

        <button type="submit" [disabled]="submitting()">
          {{ submitting() ? 'Guardando…' : 'Guardar contraseña' }}
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
        width: min(24rem, 100%);
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
export class ChangePasswordPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly form = this.formBuilder.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.errorMessage.set(null);
    this.submitting.set(true);

    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: (response) => {
        void this.router.navigateByUrl(this.auth.homeUrl(response.user.role));
      },
      error: (error: ApiError) => {
        this.errorMessage.set(error.message);
        this.submitting.set(false);
      },
    });
  }
}
