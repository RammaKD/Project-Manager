import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { forkJoin, of, Observable } from 'rxjs';
import { TasksService } from '../../../core/services/tasks-service';
import { ProjectsService } from '../../../core/services/projects-service';
import { LabelsService } from '../../../core/services/labels-service';
import { CommentsService } from '../../../core/services/comments-service';
import { AuthService } from '../../../core/services/auth-service';
import { Task, Project, Board, List, Label, ProjectMember, Comment } from '../../../core/models/project.model';
import { RouterLink } from '@angular/router';

type BoardTask = Task;

interface BoardColumn {
  id: string;
  title: string;
  tasks: BoardTask[];
}

@Component({
  selector: 'app-board-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DragDropModule],
  templateUrl: './board-view.html',
  styleUrls: ['./board-view.css']
})
export class BoardViewComponent implements OnInit {
  projectId: string | null = null;
  projectName = '';
  columns: BoardColumn[] = [];
  projectLabels: Label[] = [];
  loading = false;
  error = '';
  currentUserId: string | null = null;
  currentUserRole: ProjectMember['role'] | null = null;
  createModalOpen = false;
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskListId = '';
  newTaskPriority: BoardTask['priority'] = 'MEDIUM';
  newTaskLabelIds: string[] = [];
  priorities: BoardTask['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  editModalOpen = false;
  editTask: BoardTask | null = null;
  editTaskTitle = '';
  editTaskDescription = '';
  editTaskPriority: BoardTask['priority'] = 'MEDIUM';
  editTaskListId = '';
  editTaskLabelIds: string[] = [];
  originalEditLabelIds: string[] = [];
  comments: Comment[] = [];
  commentsLoading = false;
  commentsError = '';
  newCommentText = '';
  editingCommentId: string | null = null;
  editingCommentText = '';

  deleteModalOpen = false;
  pendingDeleteTask: BoardTask | null = null;

  get columnIds(): string[] {
    return this.columns.map(column => column.id);
  }

  getPriorityClass(priority?: BoardTask['priority']): string {
    switch (priority) {
      case 'LOW':
        return 'priority-low';
      case 'MEDIUM':
        return 'priority-medium';
      case 'HIGH':
        return 'priority-high';
      case 'CRITICAL':
        return 'priority-critical';
      default:
        return '';
    }
  }

  getCommentCount(task: BoardTask): number {
    if (task._count && typeof task._count.comments === 'number') {
      return task._count.comments;
    }

    return task.comments ? task.comments.length : 0;
  }

  constructor(
    private route: ActivatedRoute,
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private labelsService: LabelsService,
    private commentsService: CommentsService,
    private authService: AuthService
  ) {
    this.projectId = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUserId = user?.id || null;
    });
    const projectId = this.projectId;
    if (!projectId) {
      this.error = 'Project not found';
      return;
    }

    this.loadProject(projectId);
  }

  loadProject(projectId: string): void {
    this.loading = true;
    this.error = '';

    this.projectsService.getById(projectId).subscribe({
      next: (project) => {
        this.projectName = project.name;
        this.columns = this.buildColumnsFromProject(project);
        this.projectLabels = (project.labels || []).slice().sort((a, b) => a.name.localeCompare(b.name));
        this.currentUserRole = this.getMemberRole(project.members || []);
        if (!this.newTaskListId && this.columns.length > 0) {
          this.newTaskListId = this.columns[0].id;
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error loading tasks';
        this.loading = false;
      }
    });
  }

  buildColumnsFromProject(project: Project): BoardColumn[] {
    const board = this.getDefaultBoard(project);
    if (!board || !board.lists) {
      return [];
    }

    return board.lists
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((list) => ({
        id: list.id,
        title: list.name,
        tasks: (list.tasks || []).slice().sort((a, b) => a.position - b.position)
      }));
  }

  getDefaultBoard(project: Project): Board | undefined {
    if (!project.boards || project.boards.length === 0) {
      return undefined;
    }

    return project.boards.find((b) => b.isDefault) || project.boards[0];
  }

  drop(event: CdkDragDrop<BoardTask[]>): void {
    if (!this.canCreateTasks()) {
      return;
    }
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      const task = event.container.data[event.currentIndex];
      this.persistMove(task, event.container.id, event.currentIndex);
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    const task = event.container.data[event.currentIndex];
    this.persistMove(task, event.container.id, event.currentIndex);
  }

  persistMove(task: BoardTask, listId: string, position: number): void {
    if (!this.projectId) {
      return;
    }

    this.tasksService.move(task.id, { listId, position }).subscribe({
      next: () => {
        task.listId = listId;
        task.position = position;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error moving task';
        if (this.projectId) {
          this.loadProject(this.projectId);
        }
      }
    });
  }

  openCreateModal(listId?: string): void {
    if (!this.canCreateTasks()) {
      return;
    }
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskPriority = 'MEDIUM';
    this.newTaskLabelIds = [];
    if (listId) {
      this.newTaskListId = listId;
    } else if (!this.newTaskListId && this.columns.length > 0) {
      this.newTaskListId = this.columns[0].id;
    }
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  createTask(): void {
    if (!this.projectId || !this.newTaskTitle.trim() || !this.newTaskListId || !this.canCreateTasks()) {
      return;
    }

    this.tasksService.create({
      title: this.newTaskTitle.trim(),
      description: this.newTaskDescription.trim() || undefined,
      projectId: this.projectId,
      listId: this.newTaskListId,
      priority: this.newTaskPriority || undefined
    }).subscribe({
      next: (task) => {
        const assignments = this.newTaskLabelIds.map((labelId) =>
          this.labelsService.assignToTask(task.id, labelId)
        );
        const afterAssign$: Observable<unknown[]> = assignments.length > 0
          ? forkJoin(assignments)
          : of([]);
        afterAssign$.subscribe({
          next: () => {
            this.closeCreateModal();
            this.loadProject(this.projectId!);
          },
          error: (err: any) => {
            this.error = err.error?.message || 'Error assigning labels';
          }
        });
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error creating task';
      }
    });
  }

  canCreateTasks(): boolean {
    return this.currentUserRole === 'OWNER'
      || this.currentUserRole === 'ADMIN'
      || this.currentUserRole === 'MEMBER';
  }

  canCreateComments(): boolean {
    return this.canCreateTasks();
  }

  canEditComment(comment: Comment): boolean {
    return this.canCreateComments() && comment.userId === this.currentUserId;
  }

  canDeleteComment(comment: Comment): boolean {
    if (comment.userId === this.currentUserId && this.canCreateComments()) {
      return true;
    }

    return this.currentUserRole === 'OWNER' || this.currentUserRole === 'ADMIN';
  }

  private getMemberRole(members: ProjectMember[]): ProjectMember['role'] | null {
    if (!this.currentUserId) {
      return null;
    }

    const member = members.find((m) => m.userId === this.currentUserId);
    return member?.role || null;
  }

  private resetCommentsState(): void {
    this.comments = [];
    this.commentsLoading = false;
    this.commentsError = '';
    this.newCommentText = '';
    this.editingCommentId = null;
    this.editingCommentText = '';
  }

  private loadComments(taskId: string): void {
    this.commentsLoading = true;
    this.commentsError = '';
    this.commentsService.getByTask(taskId).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.setTaskCommentCount(taskId, comments.length);
        this.commentsLoading = false;
      },
      error: (err: any) => {
        this.commentsError = err.error?.message || 'Error loading comments';
        this.commentsLoading = false;
      }
    });
  }

  createComment(): void {
    if (!this.editTask || !this.newCommentText.trim() || !this.canCreateComments()) {
      return;
    }

    const content = this.newCommentText.trim();
    this.commentsService.create({ taskId: this.editTask.id, content }).subscribe({
      next: (comment) => {
        this.comments = [...this.comments, comment];
        this.incrementTaskCommentCount(this.editTask?.id || '', 1);
        this.newCommentText = '';
      },
      error: (err: any) => {
        this.commentsError = err.error?.message || 'Error creating comment';
      }
    });
  }

  startEditComment(comment: Comment): void {
    if (!this.canEditComment(comment)) {
      return;
    }
    this.editingCommentId = comment.id;
    this.editingCommentText = comment.content;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editingCommentText = '';
  }

  saveCommentEdit(): void {
    if (!this.editingCommentId || !this.editingCommentText.trim()) {
      return;
    }

    const commentId = this.editingCommentId;
    const content = this.editingCommentText.trim();
    this.commentsService.update(commentId, { content }).subscribe({
      next: (updated) => {
        this.comments = this.comments.map((comment) =>
          comment.id === updated.id ? updated : comment
        );
        this.cancelEditComment();
      },
      error: (err: any) => {
        this.commentsError = err.error?.message || 'Error updating comment';
      }
    });
  }

  deleteComment(comment: Comment): void {
    if (!this.canDeleteComment(comment)) {
      return;
    }

    this.commentsService.delete(comment.id).subscribe({
      next: () => {
        this.comments = this.comments.filter((item) => item.id !== comment.id);
        this.incrementTaskCommentCount(this.editTask?.id || '', -1);
      },
      error: (err: any) => {
        this.commentsError = err.error?.message || 'Error deleting comment';
      }
    });
  }

  openEditModal(task: BoardTask, listId: string): void {
    const existingLabelIds = (task.labels || []).map((taskLabel) => taskLabel.labelId);
    this.editTask = task;
    this.editTaskTitle = task.title;
    this.editTaskDescription = task.description || '';
    this.editTaskPriority = task.priority || 'MEDIUM';
    this.editTaskListId = listId;
    this.editTaskLabelIds = [...existingLabelIds];
    this.originalEditLabelIds = [...existingLabelIds];
    this.editModalOpen = true;
    this.resetCommentsState();
    this.loadComments(task.id);
  }

  closeEditModal(): void {
    this.editModalOpen = false;
    this.editTask = null;
    this.resetCommentsState();
  }

  saveTask(): void {
    if (!this.editTask || !this.projectId) {
      return;
    }

    const taskId = this.editTask.id;
    const originalListId = this.editTask.listId;
    const newListId = this.editTaskListId;

    this.tasksService.update(taskId, {
      title: this.editTaskTitle.trim(),
      description: this.editTaskDescription.trim() || undefined,
      priority: this.editTaskPriority || undefined
    }).subscribe({
      next: () => {
        const finishSave = () => {
          this.syncTaskLabels(taskId, this.originalEditLabelIds, this.editTaskLabelIds).subscribe({
            next: () => {
              this.closeEditModal();
              this.loadProject(this.projectId!);
            },
            error: (err: any) => {
              this.error = err.error?.message || 'Error updating labels';
            }
          });
        };

        if (newListId && newListId !== originalListId) {
          this.tasksService.move(taskId, { listId: newListId }).subscribe({
            next: () => {
              finishSave();
            },
            error: (err: any) => {
              this.error = err.error?.message || 'Error moving task';
            }
          });
          return;
        }

        finishSave();
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error updating task';
      }
    });
  }

  toggleLabelSelection(target: 'new' | 'edit', labelId: string, checked: boolean): void {
    if (target === 'new') {
      this.newTaskLabelIds = this.updateLabelSelection(this.newTaskLabelIds, labelId, checked);
      return;
    }

    this.editTaskLabelIds = this.updateLabelSelection(this.editTaskLabelIds, labelId, checked);
  }

  private updateLabelSelection(current: string[], labelId: string, checked: boolean): string[] {
    if (checked) {
      return current.includes(labelId) ? current : [...current, labelId];
    }

    return current.filter((id) => id !== labelId);
  }

  private syncTaskLabels(taskId: string, beforeIds: string[], afterIds: string[]): Observable<unknown[]> {
    const toAdd = afterIds.filter((id) => !beforeIds.includes(id));
    const toRemove = beforeIds.filter((id) => !afterIds.includes(id));

    const requests = [
      ...toAdd.map((labelId) => this.labelsService.assignToTask(taskId, labelId)),
      ...toRemove.map((labelId) => this.labelsService.removeFromTask(taskId, labelId))
    ];

    return requests.length > 0 ? forkJoin(requests) : of([]);
  }

  private setTaskCommentCount(taskId: string, count: number): void {
    if (!taskId) {
      return;
    }

    this.columns = this.columns.map((column) => ({
      ...column,
      tasks: column.tasks.map((task) =>
        task.id === taskId
          ? { ...task, _count: { comments: Math.max(0, count) } }
          : task
      )
    }));
  }

  private incrementTaskCommentCount(taskId: string, delta: number): void {
    if (!taskId || delta === 0) {
      return;
    }

    this.columns = this.columns.map((column) => ({
      ...column,
      tasks: column.tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }
        const current = this.getCommentCount(task);
        return { ...task, _count: { comments: Math.max(0, current + delta) } };
      })
    }));
  }

  openDeleteModal(task: BoardTask): void {
    this.pendingDeleteTask = task;
    this.deleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.pendingDeleteTask = null;
  }

  confirmDeleteTask(): void {
    if (!this.pendingDeleteTask || !this.projectId) {
      return;
    }

    const taskId = this.pendingDeleteTask.id;
    this.tasksService.delete(taskId).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.closeEditModal();
        this.loadProject(this.projectId!);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error deleting task';
      }
    });
  }
}
