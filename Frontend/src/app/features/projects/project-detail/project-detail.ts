import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectsService } from '../../../core/services/projects-service';
import { LabelsService } from '../../../core/services/labels-service';
import { Label, Project, ProjectMember } from '../../../core/models/project.model';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.css']
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  labels: Label[] = [];
  loading = false;
  error = '';
  editError = '';
  isEditing = false;
  savingEdit = false;
  editForm: FormGroup;
  labelError = '';
  newLabelName = '';
  newLabelColor = '#3b82f6';
  memberError = '';
  newMemberEmail = '';
  newMemberRole: ProjectMember['role'] = 'MEMBER';
  memberRoles: ProjectMember['role'][] = ['ADMIN', 'MEMBER', 'VIEWER'];
  currentUserId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private projectsService: ProjectsService,
    private labelsService: LabelsService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required]],
      key: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      description: [''],
      color: ['#3b82f6', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUserId = user?.id || null;
    });
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
        this.memberError = '';
        if (!this.isEditing) {
          this.resetEditForm(data);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error loading project';
        this.loading = false;
      }
    });
  }

  addMember(): void {
    if (!this.project || !this.newMemberEmail.trim()) {
      return;
    }

    this.memberError = '';
    this.projectsService.addMember(this.project.id, this.newMemberEmail.trim(), this.newMemberRole).subscribe({
      next: (member: ProjectMember) => {
        this.project = {
          ...this.project!,
          members: [...this.project!.members, member]
        };
        this.newMemberEmail = '';
      },
      error: (err) => {
        const message = err.error?.message || 'Error adding member';
        this.memberError = message.includes('member limit')
          ? 'You can only have up to 20 members in a project.'
          : message;
      }
    });
  }

  removeMember(member: ProjectMember): void {
    if (!this.project) {
      return;
    }

    this.memberError = '';
    this.projectsService.removeMember(this.project.id, member.id).subscribe({
      next: () => {
        this.project = {
          ...this.project!,
          members: this.project!.members.filter((m) => m.id !== member.id)
        };
      },
      error: (err) => {
        this.memberError = err.error?.message || 'Error removing member';
      }
    });
  }

  canManageMembers(): boolean {
    const role = this.getCurrentMemberRole();
    return role === 'OWNER' || role === 'ADMIN';
  }

  canEditProject(): boolean {
    const role = this.getCurrentMemberRole();
    return role === 'OWNER' || role === 'ADMIN';
  }

  canManageLabels(): boolean {
    return this.canEditProject();
  }

  startEdit(): void {
    if (!this.project) {
      return;
    }

    this.editError = '';
    this.isEditing = true;
    this.resetEditForm(this.project);
  }

  cancelEdit(): void {
    if (this.savingEdit) {
      return;
    }
    this.isEditing = false;
    this.editError = '';
    if (this.project) {
      this.resetEditForm(this.project);
    }
  }

  saveEdit(): void {
    if (!this.project || this.editForm.invalid) {
      return;
    }

    const name = String(this.editForm.value.name || '').trim();
    const key = String(this.editForm.value.key || '').trim().toUpperCase();
    const description = String(this.editForm.value.description || '').trim();
    const color = String(this.editForm.value.color || '#3b82f6');

    this.editError = '';
    this.savingEdit = true;
    this.projectsService.update(this.project.id, {
      name,
      description: description || undefined,
      key,
      color
    }).subscribe({
      next: (updated) => {
        this.project = {
          ...this.project!,
          ...updated
        };
        this.isEditing = false;
        this.savingEdit = false;
      },
      error: (err) => {
        this.editError = err.error?.message || 'Error updating project';
        this.savingEdit = false;
      }
    });
  }

  canRemoveMember(member: ProjectMember): boolean {
    const role = this.getCurrentMemberRole();
    if (!role) {
      return false;
    }

    const requesterRank = this.getRoleRank(role);
    const targetRank = this.getRoleRank(member.role);
    return requesterRank > targetRank && member.role !== 'OWNER';
  }

  private getCurrentMemberRole(): ProjectMember['role'] | null {
    if (!this.project || !this.currentUserId) {
      return null;
    }

    const member = this.project.members.find((m) => m.userId === this.currentUserId);
    return member?.role || null;
  }

  private getRoleRank(role: ProjectMember['role']): number {
    switch (role) {
      case 'OWNER':
        return 4;
      case 'ADMIN':
        return 3;
      case 'MEMBER':
        return 2;
      case 'VIEWER':
        return 1;
      default:
        return 0;
    }
  }

  get editNameControl() {
    return this.editForm.get('name');
  }

  get editKeyControl() {
    return this.editForm.get('key');
  }

  private resetEditForm(project: Project): void {
    this.editForm.patchValue({
      name: project.name,
      description: project.description || '',
      key: project.key,
      color: project.color || '#3b82f6'
    });
    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
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
        const message = err.error?.message || 'Error creating label';
        this.labelError = message.includes('Label limit')
          ? 'You can only have up to 30 labels per project.'
          : message;
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
