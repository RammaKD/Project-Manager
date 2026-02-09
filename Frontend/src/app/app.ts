import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<main><router-outlet></router-outlet></main>`,
  styles: [`main { display:block; }`]
})
export class App {
  protected readonly title = signal('Frontend');
}
