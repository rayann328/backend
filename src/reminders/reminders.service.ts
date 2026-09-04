import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Temporal } from '@js-temporal/polyfill';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUpcoming(userId: string, limit = 20) {
    const now = Date.now();

    const doseLogs =
      await this.prisma.db.orm.public.DoseLog
        .where({
          userId,
          status: 'PENDING',
        })
        .all();

    const upcoming = doseLogs
      .filter((dose) => {
        return this.toTimestamp(dose.scheduledAt) >= now;
      })
      .sort(
        (a, b) =>
          this.toTimestamp(a.scheduledAt) -
          this.toTimestamp(b.scheduledAt),
      )
      .slice(0, Math.min(Math.max(limit, 1), 100));

    return this.attachDetails(upcoming);
  }

  async getToday(userId: string) {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const startTime = startOfDay.getTime();
    const endTime = endOfDay.getTime();

    const doseLogs =
      await this.prisma.db.orm.public.DoseLog
        .where({
          userId,
        })
        .all();

    const today = doseLogs
      .filter((dose) => {
        const scheduledAt = this.toTimestamp(
          dose.scheduledAt,
        );

        return (
          scheduledAt >= startTime &&
          scheduledAt <= endTime
        );
      })
      .sort(
        (a, b) =>
          this.toTimestamp(a.scheduledAt) -
          this.toTimestamp(b.scheduledAt),
      );

    return this.attachDetails(today);
  }

  async getByDateRange(
    userId: string,
    from: Date,
    to: Date,
  ) {
    const fromTime = from.getTime();
    const toTime = to.getTime();

    const doseLogs =
      await this.prisma.db.orm.public.DoseLog
        .where({
          userId,
        })
        .all();

    const result = doseLogs
      .filter((dose) => {
        const scheduledAt = this.toTimestamp(
          dose.scheduledAt,
        );

        return (
          scheduledAt >= fromTime &&
          scheduledAt <= toTime
        );
      })
      .sort(
        (a, b) =>
          this.toTimestamp(a.scheduledAt) -
          this.toTimestamp(b.scheduledAt),
      );

    return this.attachDetails(result);
  }

  async getOne(userId: string, id: string) {
    const reminder =
      await this.prisma.db.orm.public.DoseLog.first({
        id,
        userId,
      });

    if (!reminder) {
      throw new NotFoundException(
        'Reminder not found',
      );
    }

    const details =
      await this.attachDetails([reminder]);

    return details[0];
  }

  async updateStatus(
    userId: string,
    id: string,
    status:
      | 'TAKEN'
      | 'SKIPPED'
      | 'DELAYED'
      | 'MISSED'
      | 'PENDING',
    note?: string,
  ) {
    const reminder =
      await this.prisma.db.orm.public.DoseLog.first({
        id,
        userId,
      });

    if (!reminder) {
      throw new NotFoundException(
        'Reminder not found',
      );
    }

    const updatedReminder =
      await this.prisma.db.orm.public.DoseLog
        .where({
          id,
          userId,
        })
        .update({
          status,

          takenAt:
            status === 'TAKEN'
              ? Temporal.Instant.from(
                  new Date().toISOString(),
                )
              : null,

          note:
            note !== undefined
              ? note
              : reminder.note,
        });

    const details =
      await this.attachDetails([updatedReminder]);

    return details[0];
  }

  private toTimestamp(value: unknown): number {
    if (value instanceof Temporal.Instant) {
      return Number(value.epochMilliseconds);
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    return new Date(String(value)).getTime();
  }

  private async attachDetails(
    doseLogs: any[],
  ) {
    const result = [];

    for (const dose of doseLogs) {
      const medication =
        await this.prisma.db.orm.public.Medication.first({
          id: dose.medicationId,
        });

      let schedule = null;

      if (dose.scheduleId) {
        schedule =
          await this.prisma.db.orm.public.Schedule.first({
            id: dose.scheduleId,
          });
      }

      result.push({
        ...dose,
        medication,
        schedule,
      });
    }

    return result;
  }
}