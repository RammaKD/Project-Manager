import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

/**
 * Guard que previene que usuarios autenticados accedan a rutas públicas (login, register)
 * Si están autenticados, los redirige a /projects
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si hay token en localStorage
  const token = authService.getToken();

  if (!token) {
    return true; // Permitir acceso si NO hay token
  }

  // Si hay token, redirigir y denegar acceso
  router.navigateByUrl('/projects');
  return false;
};
