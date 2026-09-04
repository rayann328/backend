import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async syncUser(userId: string) {
    const user =
      await this.prisma.db.orm.public.User.first({
        id: userId,
      });

    if (!user) {
      return {
        user: null,
        medications: [],
        schedules: [],
        doseLogs: [],
        notifications: [],
        settings: null,
      };
    }

    const medications =
      await this.prisma.db.orm.public.Medication
        .where({ userId })
        .all();

    const schedules: any[] = [];

    for (const medication of medications) {
      const medicationSchedules =
        await this.prisma.db.orm.public.Schedule
          .where({
            medicationId: medication.id,
          })
          .all();

      schedules.push(...medicationSchedules);
    }

    const doseLogs =
      await this.prisma.db.orm.public.DoseLog
        .where({ userId })
        .all();

    const notifications =
      await this.prisma.db.orm.public.Notification
        .where({ userId })
        .all();

    const settings =
      await this.prisma.db.orm.public.UserSettings.first({
        userId,
      });

    return {
      syncedAt: new Date().toISOString(),

      user: {
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
      },

      medications,
      schedules,
      doseLogs,
      notifications,
      settings,
    };
  }
}