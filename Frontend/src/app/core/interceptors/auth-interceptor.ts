import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroments.development';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(environment.tokenKey);

  // Si hay token, agregarlo a los headers
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};