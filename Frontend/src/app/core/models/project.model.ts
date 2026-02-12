import { User } from './user.model';

export interface Project {
  id: string;
  name: string;
  description?: string;
  key: string;
  color: string;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdById: string;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  boards: Board[];
  labels: Label[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user: User;
}

export interface Board {
  id: string;
  name: string;
  projectId: string;
  isDefault: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
  lists: List[];
}

export interface List {
  id: string;
  name: string;
  boardId: string;
  position: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface Label {
  id: string;
  name: string;
  color: string;
  projectId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  listId: string;
  projectId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedHours?: number;
  dueDate?: string;
  position: number;
  assignedToId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  list?: List;
  assignedTo?: User;
  createdBy: User;
  labels: TaskLabel[];
  comments?: Comment[];
  _count?: {
    comments: number;
  };
}

export interface TaskLabel {
  taskId: string;
  labelId: string;
  label: Label;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  key: string;
  color?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  key?: string;
  color?: string;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}