import { PartialType } from '@nestjs/mapped-types';
import { CreateLabelDto } from './create-label.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdateLabelDto extends PartialType(
  OmitType(CreateLabelDto, ['projectId'] as const),
) {}