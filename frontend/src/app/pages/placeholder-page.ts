import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  template: `
    <section class="placeholder">
      <h1>{{ title }}</h1>
      <p>Esta sección se implementa en un próximo paso.</p>
    </section>
  `,
  styles: [
    `
      .placeholder {
        padding: 2rem;
        background: #fff;
        border-radius: 0.75rem;
        box-shadow: 0 1px 2px rgb(15 23 42 / 8%);
      }

      h1 {
        margin-top: 0;
      }

      p {
        margin-bottom: 0;
        color: #475569;
      }
    `,
  ],
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);

  readonly title = (this.route.snapshot.data['title'] as string | undefined) ?? 'Sección';
}
