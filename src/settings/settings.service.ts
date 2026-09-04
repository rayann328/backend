import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(userId: string) {
    const existingSettings =
      await this.prisma.db.orm.public.UserSettings.first({
        userId,
      });

    if (existingSettings) {
      return existingSettings;
    }

    return this.prisma.db.orm.public.UserSettings.create({
      userId,
      darkMode: false,
      language: 'en',
      medicationReminders: true,
      notificationSound: true,
      vibration: true,
      snoozeDuration: 10,
      biometricEnabled: false,
      twoFactorEnabled: false,
    });
  }

  async updateSettings(
    userId: string,
    data: {
      darkMode?: boolean;
      language?: string;
      medicationReminders?: boolean;
      notificationSound?: boolean;
      vibration?: boolean;
      snoozeDuration?: number;
      biometricEnabled?: boolean;
      twoFactorEnabled?: boolean;
    },
  ) {
    const existingSettings =
      await this.prisma.db.orm.public.UserSettings.first({
        userId,
      });

    if (!existingSettings) {
      return this.prisma.db.orm.public.UserSettings.create({
        userId,
        darkMode: data.darkMode ?? false,
        language: data.language ?? 'en',
        medicationReminders:
          data.medicationReminders ?? true,
        notificationSound:
          data.notificationSound ?? true,
        vibration: data.vibration ?? true,
        snoozeDuration: data.snoozeDuration ?? 10,
        biometricEnabled:
          data.biometricEnabled ?? false,
        twoFactorEnabled:
          data.twoFactorEnabled ?? false,
      });
    }

    const updateData: any = {};

    if (data.darkMode !== undefined) {
      updateData.darkMode = data.darkMode;
    }

    if (data.language !== undefined) {
      updateData.language = data.language;
    }

    if (data.medicationReminders !== undefined) {
      updateData.medicationReminders =
        data.medicationReminders;
    }

    if (data.notificationSound !== undefined) {
      updateData.notificationSound =
        data.notificationSound;
    }

    if (data.vibration !== undefined) {
      updateData.vibration = data.vibration;
    }

    if (data.snoozeDuration !== undefined) {
      updateData.snoozeDuration = data.snoozeDuration;
    }

    if (data.biometricEnabled !== undefined) {
      updateData.biometricEnabled =
        data.biometricEnabled;
    }

    if (data.twoFactorEnabled !== undefined) {
      updateData.twoFactorEnabled =
        data.twoFactorEnabled;
    }

    return this.prisma.db.orm.public.UserSettings
      .where({ userId })
      .update(updateData);
  }
}