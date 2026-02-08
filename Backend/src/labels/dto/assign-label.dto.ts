import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignLabelDto {
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsUUID()
  @IsNotEmpty()
  labelId: string;
}