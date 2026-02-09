import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/project.model';
import { CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest } from '../models/task.model';
import { environment } from '../../../enviroments/enviroments.development';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private readonly API_URL = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  // Obtener todas las tareas de un proyecto
  getByProject(projectId: string): Observable<Task[]> {
    const params = new HttpParams().set('projectId', projectId);
    return this.http.get<Task[]>(this.API_URL, { params });
  }

  // Obtener una tarea por ID
  getById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.API_URL}/${id}`);
  }

  // Crear tarea
  create(data: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(this.API_URL, data);
  }

  // Actualizar tarea
  update(id: string, data: UpdateTaskRequest): Observable<Task> {
    return this.http.patch<Task>(`${this.API_URL}/${id}`, data);
  }

  // Mover tarea (drag & drop)
  move(id: string, data: MoveTaskRequest): Observable<Task> {
    return this.http.patch<Task>(`${this.API_URL}/${id}/move`, data);
  }

  // Eliminar tarea
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}