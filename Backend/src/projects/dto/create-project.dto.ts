import { IsString, IsNotEmpty, IsOptional, IsDateString, Length, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
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