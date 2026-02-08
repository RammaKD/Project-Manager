import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('labels')
@UseGuards(JwtAuthGuard)
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  create(@Body() createLabelDto: CreateLabelDto, @CurrentUser() user: any) {
    return this.labelsService.create(createLabelDto, user.id);
  }

  @Get()
  findAll(@Query('projectId') projectId: string, @CurrentUser() user: any) {
    return this.labelsService.findAll(projectId, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLabelDto: UpdateLabelDto,
    @CurrentUser() user: any,
  ) {
    return this.labelsService.update(id, updateLabelDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.labelsService.remove(id, user.id);
  }

  @Post('assign')
  assignToTask(
    @Body('taskId') taskId: string,
    @Body('labelId') labelId: string,
    @CurrentUser() user: any,
  ) {
    return this.labelsService.assignToTask(taskId, labelId, user.id);
  }

  @Delete(':labelId/tasks/:taskId')
  removeFromTask(
    @Param('taskId') taskId: string,
    @Param('labelId') labelId: string,
    @CurrentUser() user: any,
  ) {
    return this.labelsService.removeFromTask(taskId, labelId, user.id);
  }
}