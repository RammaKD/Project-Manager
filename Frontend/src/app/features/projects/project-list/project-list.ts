import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectsService } from '../../../core/services/projects-service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-list.html',
  styleUrls: ['./project-list.css']
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  loading = false;
  error = '';
  deleteModalOpen = false;
  pendingDeleteId: string | null = null;
  pendingDeleteName = '';

  constructor(private projectsService: ProjectsService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.error = '';

    this.projectsService.getAll().subscribe({
      next: (data) => {
        this.projects = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error loading projects';
        this.loading = false;
      }
    });
  }

  openDeleteModal(project: Project): void {
    this.pendingDeleteId = project.id;
    this.pendingDeleteName = project.name;
    this.deleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.pendingDeleteId = null;
    this.pendingDeleteName = '';
  }

  confirmDelete(): void {
    if (!this.pendingDeleteId) {
      return;
    }

    const projectId = this.pendingDeleteId;
    this.projectsService.delete(projectId).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== projectId);
        this.closeDeleteModal();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error deleting project';
        this.closeDeleteModal();
      }
    });
  }
}
