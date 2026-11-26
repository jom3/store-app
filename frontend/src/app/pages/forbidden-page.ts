import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden-page',
  imports: [RouterLink],
  template: `
    <main class="forbidden">
      <h1>Acceso denegado</h1>
      <p>Tu rol no tiene permiso para ver esta sección.</p>
      <a routerLink="/">Volver al inicio</a>
    </main>
  `,
  styles: [
    `
      .forbidden {
        min-height: 100vh;
        display: grid;
        place-content: center;
        justify-items: center;
        gap: 0.75rem;
        background: #f1f5f9;
        color: #0f172a;
        text-align: center;
        padding: 1.5rem;
      }

      h1 {
        margin: 0;
      }

      a {
        color: #1d4ed8;
      }
    `,
  ],
})
export class ForbiddenPage {}
