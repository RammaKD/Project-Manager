import { IsString, IsNotEmpty, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name: string;

  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex color code (e.g., #3b82f6)',
  })
  color: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}