import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Label } from '../models';
import { environment } from '../../../enviroments/enviroments.development';

@Injectable({
  providedIn: 'root'
})
export class LabelsService {
  private readonly API_URL = `${environment.apiUrl}/labels`;

  constructor(private http: HttpClient) {}

  // Obtener todas las etiquetas de un proyecto
  getByProject(projectId: string): Observable<Label[]> {
    const params = new HttpParams().set('projectId', projectId);
    return this.http.get<Label[]>(this.API_URL, { params });
  }

  // Crear etiqueta
  create(data: { name: string; color: string; projectId: string }): Observable<Label> {
    return this.http.post<Label>(this.API_URL, data);
  }

  // Actualizar etiqueta
  update(id: string, data: { name?: string; color?: string }): Observable<Label> {
    return this.http.patch<Label>(`${this.API_URL}/${id}`, data);
  }

  // Eliminar etiqueta
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  // Asignar etiqueta a tarea
  assignToTask(taskId: string, labelId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/assign`, { taskId, labelId });
  }

  // Remover etiqueta de tarea
  removeFromTask(taskId: string, labelId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${labelId}/tasks/${taskId}`);
  }
}