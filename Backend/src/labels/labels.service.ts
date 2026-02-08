import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelsService {
  constructor(private prisma: PrismaService) {}

  async create(createLabelDto: CreateLabelDto, userId: string) {
    // Verificar que el usuario es miembro del proyecto
    await this.verifyProjectMember(createLabelDto.projectId, userId, ['OWNER', 'ADMIN']);

    // Verificar que no exista una etiqueta con el mismo nombre en el proyecto
    const existingLabel = await this.prisma.label.findFirst({
      where: {
        projectId: createLabelDto.projectId,
        name: createLabelDto.name,
      },
    });

    if (existingLabel) {
      throw new ConflictException('A label with this name already exists in this project');
    }

    return this.prisma.label.create({
      data: createLabelDto,
    });
  }

  async findAll(projectId: string, userId: string) {
    // Verificar que el usuario es miembro del proyecto
    await this.verifyProjectMember(projectId, userId);

    return this.prisma.label.findMany({
      where: { projectId },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async update(id: string, updateLabelDto: UpdateLabelDto, userId: string) {
    const label = await this.prisma.label.findUnique({
      where: { id },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Verificar permisos
    await this.verifyProjectMember(label.projectId, userId, ['OWNER', 'ADMIN']);

    return this.prisma.label.update({
      where: { id },
      data: updateLabelDto,
    });
  }

  async remove(id: string, userId: string) {
    const label = await this.prisma.label.findUnique({
      where: { id },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Verificar permisos
    await this.verifyProjectMember(label.projectId, userId, ['OWNER', 'ADMIN']);

    return this.prisma.label.delete({
      where: { id },
    });
  }

  async assignToTask(taskId: string, labelId: string, userId: string) {
    // Verificar que la tarea existe
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verificar que la etiqueta existe
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Verificar que la etiqueta pertenece al mismo proyecto que la tarea
    if (label.projectId !== task.projectId) {
      throw new ForbiddenException('Label does not belong to the same project as the task');
    }

    // Verificar que el usuario es miembro del proyecto
    await this.verifyProjectMember(task.projectId, userId);

    // Verificar que no esté ya asignada
    const existing = await this.prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Label already assigned to this task');
    }

    // Asignar etiqueta
    await this.prisma.taskLabel.create({
      data: {
        taskId,
        labelId,
      },
    });

    // Retornar la tarea actualizada con sus etiquetas
    return this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
      },
    });
  }

  async removeFromTask(taskId: string, labelId: string, userId: string) {
    // Verificar que la tarea existe
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verificar que el usuario es miembro del proyecto
    await this.verifyProjectMember(task.projectId, userId);

    // Verificar que la etiqueta está asignada
    const existing = await this.prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Label not assigned to this task');
    }

    // Remover etiqueta
    await this.prisma.taskLabel.delete({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

    // Retornar la tarea actualizada
    return this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
      },
    });
  }

  private async verifyProjectMember(projectId: string, userId: string, allowedRoles?: string[]) {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (allowedRoles && !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return member;
  }
}