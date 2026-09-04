import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { Temporal } from '@js-temporal/polyfill';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user =
      await this.prisma.db.orm.public.User.first({
        id: userId,
      });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.safeUser(user);
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      dateOfBirth?: Date | string | null;
    },
  ) {
    await this.getProfile(userId);

    const updateData: any = {};

    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName?.trim() || null;
    }

    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName?.trim() || null;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone?.trim() || null;
    }

    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth
        ? Temporal.Instant.from(
            new Date(data.dateOfBirth).toISOString(),
          )
        : null;
    }

    const updatedUser =
      await this.prisma.db.orm.public.User
        .where({ id: userId })
        .update(updateData);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return this.safeUser(updatedUser);
  }

  async changePassword(
    userId: string,
    data: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    const user =
      await this.prisma.db.orm.public.User.first({
        id: userId,
      });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatches = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Current password is incorrect',
      );
    }

    if (data.newPassword.length < 8) {
      throw new UnauthorizedException(
        'New password must be at least 8 characters',
      );
    }

    const passwordHash = await bcrypt.hash(
      data.newPassword,
      12,
    );

    await this.prisma.db.orm.public.User
      .where({ id: userId })
      .update({
        passwordHash,
      });

    return {
      message: 'Password changed successfully',
    };
  }

  private safeUser(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    dateOfBirth: Date | null;
    role: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
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
}