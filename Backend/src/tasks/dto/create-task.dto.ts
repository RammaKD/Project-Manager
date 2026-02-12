import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString, IsUUID, MaxLength } from 'class-validator';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  listId: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}