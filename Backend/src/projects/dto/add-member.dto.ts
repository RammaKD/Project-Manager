import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum ProjectMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(ProjectMemberRole)
  role: ProjectMemberRole;
}