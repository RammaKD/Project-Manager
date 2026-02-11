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

    if (addMemberDto.role === 'OWNER') {
      throw new ForbiddenException('Cannot assign OWNER role');
    }

    const lookupId = addMemberDto.userId;
    const lookupEmail = addMemberDto.email?.trim();

    if (!lookupId && !lookupEmail) {
      throw new ConflictException('User identifier is required');
    }

    const memberCount = await this.prisma.projectMember.count({
      where: { projectId },
    });

    if (memberCount >= 20) {
      throw new ConflictException('Project member limit reached (20)');
    }

    // Verificar que el usuario a agregar exista
    const userExists = await this.prisma.user.findUnique({
      where: lookupId ? { id: lookupId } : { email: lookupEmail! },
    });

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    // Verificar que no sea ya miembro
    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: userExists.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId: userExists.id,
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
    const requester = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!requester) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.projectId !== projectId) {
      throw new NotFoundException('Member not found');
    }

    // No permitir remover al owner
    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove project owner');
    }

    const requesterRank = this.getRoleRank(requester.role);
    const targetRank = this.getRoleRank(member.role);

    if (requesterRank <= targetRank) {
      throw new ForbiddenException('Insufficient permissions to remove this member');
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

  private getRoleRank(role: string): number {
    switch (role) {
      case 'OWNER':
        return 4;
      case 'ADMIN':
        return 3;
      case 'MEMBER':
        return 2;
      case 'VIEWER':
        return 1;
      default:
        return 0;
    }
  }
}