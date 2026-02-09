import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { ProjectsLayoutComponent } from './features/projects/projects-layout';
import { authGuard } from './core/guards/auth-guard';
import { publicGuard } from './core/guards/public-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'projects',
    component: ProjectsLayoutComponent,
    canActivate: [authGuard],
    children: [
      // Aquí irán las rutas de projects (list, detail)
      { path: '', redirectTo: 'list', pathMatch: 'full' }
      // { path: 'list', component: ProjectListComponent },
      // { path: ':id', component: ProjectDetailComponent }
    ]
  },
  {
    path: 'board',
    canActivate: [authGuard],
    children: [
      // Aquí irán las rutas del board
      { path: '', redirectTo: 'view', pathMatch: 'full' }
      // { path: 'view', component: BoardViewComponent }
    ]
  },
  // Ruta raíz - redirige a login o projects dependiendo de autenticación
  {
    path: '',
    redirectTo: '/projects',
    pathMatch: 'full'
  },
  // Wildcard para rutas no encontradas
  {
    path: '**',
    redirectTo: '/login'
  }
];
