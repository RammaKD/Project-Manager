import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '../../../core/services/projects-service';
import { LabelsService } from '../../../core/services/labels-service';
import { Label, Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.css']
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  labels: Label[] = [];
  loading = false;
  error = '';
  labelError = '';
  newLabelName = '';
  newLabelColor = '#3b82f6';

  constructor(
    private projectsService: ProjectsService,
    private labelsService: LabelsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProject(projectId);
    }
  }

  loadProject(id: string): void {
    this.loading = true;
    this.projectsService.getById(id).subscribe({
      next: (data) => {
        this.project = data;
        this.labels = (data.labels || []).slice().sort((a, b) => a.name.localeCompare(b.name));
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error loading project';
        this.loading = false;
      }
    });
  }

  createLabel(): void {
    if (!this.project || !this.newLabelName.trim()) {
      return;
    }

    this.labelError = '';
    this.labelsService.create({
      name: this.newLabelName.trim(),
      color: this.newLabelColor,
      projectId: this.project.id
    }).subscribe({
      next: (label) => {
        this.labels = [...this.labels, label].sort((a, b) => a.name.localeCompare(b.name));
        this.newLabelName = '';
      },
      error: (err) => {
        this.labelError = err.error?.message || 'Error creating label';
      }
    });
  }

  deleteLabel(labelId: string): void {
    if (!this.project) {
      return;
    }

    this.labelError = '';
    this.labelsService.delete(labelId).subscribe({
      next: () => {
        this.labels = this.labels.filter(label => label.id !== labelId);
      },
      error: (err) => {
        this.labelError = err.error?.message || 'Error deleting label';
      }
    });
  }
}
