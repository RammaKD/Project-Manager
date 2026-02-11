import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectsService } from '../../../core/services/projects-service';
import { AuthService } from '../../../core/services/auth-service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
  currentUserId: string | null = null;
  searchTerm = '';
  sortOrder: 'newest' | 'oldest' = 'newest';
  memberFilter: 'all' | '1-5' | '6-10' | '11+' = 'all';
  pageSize = 2;
  currentPage = 1;

  get filteredProjects(): Project[] {
    const term = this.searchTerm.trim().toLowerCase();

    let results = this.projects.filter(project => {
      const nameMatch = !term || project.name.toLowerCase().includes(term);
      return nameMatch && this.matchesMemberFilter(project.members?.length || 0);
    });

    results = results.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return this.sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
    });

    return results;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProjects.length / this.pageSize));
  }

  get pageItems(): Array<number | 'ellipsis'> {
    const maxNumbers = 10;
    const total = this.totalPages;
    if (total <= maxNumbers) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const windowSize = maxNumbers - 2;
    const half = Math.floor(windowSize / 2);
    let start = this.currentPage - half;
    let end = this.currentPage + half - 1;

    if (start < 2) {
      start = 2;
      end = start + windowSize - 1;
    }

    if (end > total - 1) {
      end = total - 1;
      start = end - windowSize + 1;
    }

    const items: Array<number | 'ellipsis'> = [1];

    if (start > 2) {
      items.push('ellipsis');
    }

    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }

    if (end < total - 1) {
      items.push('ellipsis');
    }

    items.push(total);
    return items;
  }

  get pagedProjects(): Project[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProjects.slice(start, start + this.pageSize);
  }

  constructor(
    private projectsService: ProjectsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUserId = user?.id || null;
    });
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.error = '';

    this.projectsService.getAll().subscribe({
      next: (data) => {
        this.projects = data;
        this.currentPage = 1;
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

  onFilterChange(): void {
    this.currentPage = 1;
  }

  prevPage(): void {
    this.currentPage = Math.max(1, this.currentPage - 1);
  }

  nextPage(): void {
    this.currentPage = Math.min(this.totalPages, this.currentPage + 1);
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(this.totalPages, Math.max(1, page));
  }

  isPageNumber(item: number | 'ellipsis'): item is number {
    return item !== 'ellipsis';
  }

  private matchesMemberFilter(count: number): boolean {
    switch (this.memberFilter) {
      case '1-5':
        return count >= 1 && count <= 5;
      case '6-10':
        return count >= 6 && count <= 10;
      case '11+':
        return count >= 11;
      default:
        return true;
    }
  }

  confirmDelete(): void {
    if (!this.pendingDeleteId) {
      return;
    }

    const projectId = this.pendingDeleteId;
    this.projectsService.delete(projectId).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== projectId);
        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages;
        }
        this.closeDeleteModal();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error deleting project';
        this.closeDeleteModal();
      }
    });
  }

  canDeleteProject(project: Project): boolean {
    if (!this.currentUserId) {
      return false;
    }

    const member = project.members.find((m) => m.userId === this.currentUserId);
    return member?.role === 'OWNER';
  }
}
