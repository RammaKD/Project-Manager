import { IsString, IsNotEmpty, IsOptional, IsDateString, Length } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @Length(2, 10)
  key: string; // ej: "PROJ", "DEV"

  @IsString()
  @IsOptional()
  color?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}