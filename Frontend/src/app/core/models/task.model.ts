export interface CreateTaskRequest {
  title: string;
  description?: string;
  listId: string;
  projectId: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedHours?: number;
  dueDate?: string;
  assignedToId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedHours?: number;
  dueDate?: string;
  assignedToId?: string;
  position?: number;
}

export interface MoveTaskRequest {
  listId: string;
  position?: number;
}