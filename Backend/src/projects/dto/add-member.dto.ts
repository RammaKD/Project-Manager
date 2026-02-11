import { IsString, IsNotEmpty, IsEnum, IsOptional, IsEmail } from 'class-validator';

export enum ProjectMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  userId?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(ProjectMemberRole)
  role: ProjectMemberRole;
}