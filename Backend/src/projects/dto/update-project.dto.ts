import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';
import { IsEnum, IsOptional } from 'class-validator';

enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
}