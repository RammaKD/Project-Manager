import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models';
import { Router } from '@angular/router';
import { environment } from '../../../enviroments/enviroments.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl; 
  private readonly TOKEN_KEY = environment.tokenKey; 
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Al iniciar, verificar si hay un token guardado
    this.checkAuth();
  }

  // Registro
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, data)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  // Login
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, data)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Obtener usuario actual del servidor
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/me`)
      .pipe(
        tap(user => this.currentUserSubject.next(user))
      );
  }

  // Verificar si hay sesión activa
  private checkAuth(): void {
    const token = this.getToken();
    if (token) {
      // Si hay token, obtener datos del usuario (sin borrar token si falla)
      this.getCurrentUser().subscribe({
        next: (user) => {
          // Token válido, usuario cargado
        },
        error: (err) => {
          // No borrar el token aquí, solo evitar cargar el usuario
          console.warn('Error al obtener usuario actual:', err);
        }
      });
    }
  }

  // Manejar respuesta de autenticación
  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    this.currentUserSubject.next(response.user);
  }

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Obtener valor actual del usuario (síncrono)
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}