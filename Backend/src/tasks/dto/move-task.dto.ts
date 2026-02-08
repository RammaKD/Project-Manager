import { IsUUID, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class MoveTaskDto {
  @IsUUID()
  @IsNotEmpty()
  listId: string;

  @IsNumber()
  @IsOptional()
  position?: number;
}