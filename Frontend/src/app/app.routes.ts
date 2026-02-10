import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { ProjectListComponent } from './features/projects/project-list/project-list';
import { ProjectDetailComponent } from './features/projects/project-detail/project-detail';
import { ProjectCreateComponent } from './features/projects/project-create/project-create';
import { LayoutComponent } from './shared/components/layout/layout';
import { BoardViewComponent } from './features/board/board-view/board-view';
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
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'projects',
        children: [
          { path: 'list', component: ProjectListComponent },
          { path: 'create', component: ProjectCreateComponent },
          { path: ':id/board', component: BoardViewComponent },
          { path: ':id', component: ProjectDetailComponent },
          { path: '', redirectTo: 'list', pathMatch: 'full' }
        ]
      },
      {
        path: '',
        redirectTo: '/projects',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
