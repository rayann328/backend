import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private safeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.db.orm.public.User.first({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.safeUser(user);
  }

  async updateMe(userId: string, data: any) {
    const user = await this.prisma.db.orm.public.User.first({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.db.orm.public.User
      .where({ id: userId })
      .update({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
      });

    return this.safeUser(updated);
  }

  async findById(id: string) {
    const user = await this.prisma.db.orm.public.User.first({
      id,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.safeUser(user);
  }

  async deleteMe(userId: string) {
    const user = await this.prisma.db.orm.public.User.first({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.db.orm.public.User
      .where({ id: userId })
      .delete();

    return {
      message: 'User deleted successfully',
    };
  }
}
