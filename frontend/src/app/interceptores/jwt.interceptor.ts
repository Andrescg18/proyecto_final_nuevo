import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { AuthService } from '../servicios/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const authService = injector.get(AuthService);
  const token = authService.getToken();

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
