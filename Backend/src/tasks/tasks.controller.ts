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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: any) {
    return this.tasksService.create(createTaskDto, user.id);
  }

  @Get()
  findAll(@Query('projectId') projectId: string, @CurrentUser() user: any) {
    return this.tasksService.findAll(projectId, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.update(id, updateTaskDto, user.id);
  }

  @Patch(':id/move')
  move(
    @Param('id') id: string,
    @Body() moveTaskDto: MoveTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.move(id, moveTaskDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.remove(id, user.id);
  }
}