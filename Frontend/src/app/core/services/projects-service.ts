import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../models';
import { environment } from '../../../enviroments/enviroments.development';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private readonly API_URL = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  // Obtener todos los proyectos del usuario
  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(this.API_URL);
  }

  // Obtener un proyecto por ID
  getById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.API_URL}/${id}`);
  }

  // Crear proyecto
  create(data: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.API_URL, data);
  }

  // Actualizar proyecto
  update(id: string, data: UpdateProjectRequest): Observable<Project> {
    return this.http.patch<Project>(`${this.API_URL}/${id}`, data);
  }

  // Eliminar proyecto
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  // Agregar miembro al proyecto
  addMember(projectId: string, email: string, role: string): Observable<any> {
    return this.http.post(`${this.API_URL}/${projectId}/members`, {
      email,
      role
    });
  }

  // Remover miembro del proyecto
  removeMember(projectId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${projectId}/members/${memberId}`);
  }
}