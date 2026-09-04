import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.db.orm.public.Notification
      .where({ userId })
      .all();
  }

  async findOne(userId: string, id: string) {
    const notification =
      await this.prisma.db.orm.public.Notification.first({
        id,
        userId,
      });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async create(
    userId: string,
    data: {
      title: string;
      message: string;
      type?: string;
      isRead?: boolean;
    },
  ) {
    return this.prisma.db.orm.public.Notification.create({
      userId,
      title: data.title,
      message: data.message,
      type: data.type ?? null,
      isRead: data.isRead ?? false,
    });
  }

  async update(
    userId: string,
    id: string,
    data: {
      title?: string;
      message?: string;
      type?: string | null;
      isRead?: boolean;
    },
  ) {
    await this.findOne(userId, id);

    return this.prisma.db.orm.public.Notification
      .where({
        id,
        userId,
      })
      .update(data);
  }

  async markAsRead(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.db.orm.public.Notification
      .where({
        id,
        userId,
      })
      .update({
        isRead: true,
      });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.db.orm.public.Notification
      .where({
        id,
        userId,
      })
      .delete();
  }
}