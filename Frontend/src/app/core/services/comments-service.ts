import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment } from '../models/project.model';
import { environment } from '../../../enviroments/enviroments.development';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private readonly API_URL = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  getByTask(taskId: string): Observable<Comment[]> {
    const params = new HttpParams().set('taskId', taskId);
    return this.http.get<Comment[]>(this.API_URL, { params });
  }

  create(data: { taskId: string; content: string }): Observable<Comment> {
    return this.http.post<Comment>(this.API_URL, data);
  }

  update(id: string, data: { content: string }): Observable<Comment> {
    return this.http.patch<Comment>(`${this.API_URL}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
