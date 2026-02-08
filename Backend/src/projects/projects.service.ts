import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    // Verificar que el key sea único
    const existingProject = await this.prisma.project.findUnique({
      where: { key: createProjectDto.key },
    });

    if (existingProject) {
      throw new ConflictException('Project key already exists');
    }

    // Crear proyecto
    const project = await this.prisma.project.create({
      data: {
        ...createProjectDto,
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
        // Crear un tablero por defecto
        boards: {
          create: {
            name: 'Main Board',
            isDefault: true,
            position: 0,
            lists: {
              create: [
                { name: 'To Do', position: 0 },
                { name: 'In Progress', position: 1 },
                { name: 'Done', position: 2 },
              ],
            },
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        boards: {
          include: {
            lists: true,
          },
        },
      },
    });

    return project;
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
        boards: {
          include: {
            lists: {
              include: {
                tasks: {
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
                  orderBy: {
                    position: 'asc',
                  },
                },
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
        labels: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verificar que el usuario sea miembro
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string) {
    await this.verifyMemberPermission(id, userId, ['OWNER', 'ADMIN']);

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.verifyMemberPermission(id, userId, ['OWNER']);

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async addMember(projectId: string, addMemberDto: AddMemberDto, userId: string) {
    await this.verifyMemberPermission(projectId, userId, ['OWNER', 'ADMIN']);

    // Verificar que el usuario a agregar exista
    const userExists = await this.prisma.user.findUnique({
      where: { id: addMemberDto.userId },
    });

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    // Verificar que no sea ya miembro
    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: addMemberDto.userId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId: addMemberDto.userId,
        role: addMemberDto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async removeMember(projectId: string, memberId: string, userId: string) {
    await this.verifyMemberPermission(projectId, userId, ['OWNER', 'ADMIN']);

    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: memberId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // No permitir remover al owner
    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove project owner');
    }

    return this.prisma.projectMember.delete({
      where: {
        id: member.id,
      },
    });
  }

  private async verifyMemberPermission(
    projectId: string,
    userId: string,
    allowedRoles: string[],
  ) {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return member;
  }
}