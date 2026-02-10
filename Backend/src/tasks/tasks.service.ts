import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    // Verificar que el usuario es miembro del proyecto
    await this.verifyProjectMember(createTaskDto.projectId, userId);

    // Verificar que la lista pertenece al proyecto
    const list = await this.prisma.list.findUnique({
      where: { id: createTaskDto.listId },
      include: { board: true },
    });

    if (!list || list.board.projectId !== createTaskDto.projectId) {
      throw new NotFoundException('List not found in this project');
    }

    // Si se asigna a alguien, verificar que sea miembro
    if (createTaskDto.assignedToId) {
      await this.verifyProjectMember(createTaskDto.projectId, createTaskDto.assignedToId);
    }

    // Obtener la última posición en la lista
    const lastTask = await this.prisma.task.findFirst({
      where: { listId: createTaskDto.listId },
      orderBy: { position: 'desc' },
    });

    const position = lastTask ? lastTask.position + 1 : 0;

    // Crear tarea
    const task = await this.prisma.task.create({
      data: {
        ...createTaskDto,
        position,
        createdById: userId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    // Registrar en historial
    await this.prisma.taskHistory.create({
      data: {
        taskId: task.id,
        userId,
        action: 'CREATED',
        details: JSON.stringify({ title: task.title }),
      },
    });

    return task;
  }

  async findAll(projectId: string, userId: string) {
    await this.verifyProjectMember(projectId, userId);

    return this.prisma.task.findMany({
      where: { projectId },
      include: {
        list: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        history: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
        list: true,
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.verifyProjectMember(task.projectId, userId);

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.verifyProjectMember(task.projectId, userId);

    // Si se cambia el assignee, verificar que sea miembro
    if (updateTaskDto.assignedToId) {
      await this.verifyProjectMember(task.projectId, updateTaskDto.assignedToId);
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    // Registrar cambios en historial
    const changes = Object.keys(updateTaskDto);
    if (changes.length > 0) {
      await this.prisma.taskHistory.create({
        data: {
          taskId: id,
          userId,
          action: 'UPDATED',
          details: JSON.stringify(updateTaskDto),
        },
      });
    }

    return updatedTask;
  }

  async move(id: string, moveTaskDto: MoveTaskDto, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { list: { include: { board: true } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.verifyProjectMember(task.projectId, userId);

    // Verificar que la nueva lista pertenece al mismo proyecto
    const newList = await this.prisma.list.findUnique({
      where: { id: moveTaskDto.listId },
      include: { board: true },
    });

    if (!newList || newList.board.projectId !== task.projectId) {
      throw new NotFoundException('List not found in this project');
    }

    const oldListId = task.listId;
    const newListId = moveTaskDto.listId;

    // Si se mueve a una lista diferente
    if (oldListId !== newListId) {
      // Obtener la última posición en la nueva lista
      const lastTaskInNewList = await this.prisma.task.findFirst({
        where: { listId: newListId },
        orderBy: { position: 'desc' },
      });

      const newPosition = moveTaskDto.position ?? (lastTaskInNewList ? lastTaskInNewList.position + 1 : 0);

      // Actualizar la tarea
      const updatedTask = await this.prisma.task.update({
        where: { id },
        data: {
          listId: newListId,
          position: newPosition,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          labels: {
            include: {
              label: true,
            },
          },
        },
      });

      // Registrar en historial
      await this.prisma.taskHistory.create({
        data: {
          taskId: id,
          userId,
          action: 'MOVED',
          details: JSON.stringify({
            from: task.list.name,
            to: newList.name,
          }),
        },
      });

      return updatedTask;
    } else {
      // Solo cambio de posición en la misma lista
      return this.prisma.task.update({
        where: { id },
        data: {
          position: moveTaskDto.position,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          labels: {
            include: {
              label: true,
            },
          },
        },
      });
    }
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.verifyProjectMember(task.projectId, userId);

    return this.prisma.task.delete({
      where: { id },
    });
  }

  private async verifyProjectMember(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return member;
  }
}