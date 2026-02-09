import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-projects-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="projects-layout">
      <h1>Projects</h1>
      <p>Aquí irán los proyectos</p>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .projects-layout {
      padding: 20px;
    }
  `]
})
export class ProjectsLayoutComponent {}
