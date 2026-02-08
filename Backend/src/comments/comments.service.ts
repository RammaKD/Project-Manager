import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(createCommentDto: CreateCommentDto, userId: string) {
    // Verificar que la tarea existe
    const task = await this.prisma.task.findUnique({
      where: { id: createCommentDto.taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verificar que el usuario es miembro del proyecto
    await this.verifyProjectMember(task.projectId, userId);

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        taskId: createCommentDto.taskId,
        userId,
      },
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
    });

    // Registrar en historial
    await this.prisma.taskHistory.create({
      data: {
        taskId: createCommentDto.taskId,
        userId,
        action: 'COMMENTED',
        details: JSON.stringify({ comment: createCommentDto.content.substring(0, 50) }),
      },
    });

    return comment;
  }

  async findAll(taskId: string, userId: string) {
    // Verificar que la tarea existe
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verificar que el usuario es miembro del proyecto
    await this.verifyProjectMember(task.projectId, userId);

    return this.prisma.comment.findMany({
      where: { taskId },
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
    });
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Solo el autor puede editar su comentario
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id },
      data: { content: updateCommentDto.content },
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
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Verificar permisos (autor o admin del proyecto)
    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId: comment.task.projectId,
        userId,
      },
    });

    const canDelete = comment.userId === userId || member?.role === 'OWNER' || member?.role === 'ADMIN';

    if (!canDelete) {
      throw new ForbiddenException('Insufficient permissions to delete this comment');
    }

    return this.prisma.comment.delete({
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