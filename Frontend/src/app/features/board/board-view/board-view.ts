import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TasksService } from '../../../core/services/tasks-service';
import { ProjectsService } from '../../../core/services/projects-service';
import { Task, Project, Board, List } from '../../../core/models/project.model';
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
  loading = false;
  error = '';
  createModalOpen = false;
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskListId = '';
  newTaskPriority: BoardTask['priority'] = 'MEDIUM';
  priorities: BoardTask['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  get columnIds(): string[] {
    return this.columns.map(column => column.id);
  }

  constructor(
    private route: ActivatedRoute,
    private tasksService: TasksService,
    private projectsService: ProjectsService
  ) {
    this.projectId = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
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
        if (!this.newTaskListId && this.columns.length > 0) {
          this.newTaskListId = this.columns[0].id;
        }
        this.loading = false;
      },
      error: (err) => {
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
      error: (err) => {
        this.error = err.error?.message || 'Error moving task';
        if (this.projectId) {
          this.loadProject(this.projectId);
        }
      }
    });
  }

  openCreateModal(listId?: string): void {
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskPriority = 'MEDIUM';
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
    if (!this.projectId || !this.newTaskTitle.trim() || !this.newTaskListId) {
      return;
    }

    this.tasksService.create({
      title: this.newTaskTitle.trim(),
      description: this.newTaskDescription.trim() || undefined,
      projectId: this.projectId,
      listId: this.newTaskListId,
      priority: this.newTaskPriority || undefined
    }).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadProject(this.projectId!);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error creating task';
      }
    });
  }
}
