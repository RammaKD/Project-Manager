import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectsService } from '../../../core/services/projects-service';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './project-create.html',
  styleUrls: ['./project-create.css']
})
export class ProjectCreateComponent {
  projectForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private projectsService: ProjectsService,
    private router: Router
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      key: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      description: ['', [Validators.maxLength(2000)]],
      color: ['#007bff', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.projectsService.create(this.projectForm.value).subscribe({
      next: () => {
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error creating project';
        this.loading = false;
      }
    });
  }

  get name() {
    return this.projectForm.get('name');
  }

  get key() {
    return this.projectForm.get('key');
  }

  get description() {
    return this.projectForm.get('description');
  }
}
