import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Temporal } from '@js-temporal/polyfill';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, medicationId?: string) {
    if (medicationId) {
      const medication =
        await this.prisma.db.orm.public.Medication.first({
          id: medicationId,
          userId,
        });

      if (!medication) {
        throw new NotFoundException('Medication not found');
      }

      return this.prisma.db.orm.public.Schedule
        .where({ medicationId })
        .all();
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

    return schedules;
  }

  async findOne(userId: string, id: string) {
    const schedule =
      await this.prisma.db.orm.public.Schedule.first({
        id,
      });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    const medication =
      await this.prisma.db.orm.public.Medication.first({
        id: schedule.medicationId,
        userId,
      });

    if (!medication) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  async create(
    userId: string,
    data: {
      medicationId: string;
      scheduleType:
        | 'DAILY'
        | 'WEEKLY'
        | 'MONTHLY'
        | 'CUSTOM'
        | 'INTERVAL'
        | 'ONE_TIME';
      startDate: Date | string;
      endDate?: Date | string;
      intervalValue?: number;
      intervalUnit?: string;
      daysOfWeek?: string;
      dayOfMonth?: number;
      timeOfDay?: string;
      timingTag?: string;
    },
  ) {
    const medication =
      await this.prisma.db.orm.public.Medication.first({
        id: data.medicationId,
        userId,
      });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    return this.prisma.db.orm.public.Schedule.create({
      medicationId: data.medicationId,
      scheduleType: data.scheduleType,

      startDate: Temporal.Instant.from(
        new Date(data.startDate).toISOString(),
      ),

      endDate: data.endDate
        ? Temporal.Instant.from(
            new Date(data.endDate).toISOString(),
          )
        : null,

      intervalValue: data.intervalValue ?? null,
      intervalUnit: data.intervalUnit ?? null,
      daysOfWeek: data.daysOfWeek ?? null,
      dayOfMonth: data.dayOfMonth ?? null,
      timeOfDay: data.timeOfDay ?? null,
      timingTag: data.timingTag ?? null,
    });
  }

  async update(
    userId: string,
    id: string,
    data: {
      scheduleType?:
        | 'DAILY'
        | 'WEEKLY'
        | 'MONTHLY'
        | 'CUSTOM'
        | 'INTERVAL'
        | 'ONE_TIME';

      startDate?: Date | string;

      endDate?: Date | string | null;

      intervalValue?: number | null;
      intervalUnit?: string | null;
      daysOfWeek?: string | null;
      dayOfMonth?: number | null;
      timeOfDay?: string | null;
      timingTag?: string | null;
    },
  ) {
    await this.findOne(userId, id);

    const updateData: any = {};

    if (data.scheduleType !== undefined) {
      updateData.scheduleType = data.scheduleType;
    }

    if (data.startDate !== undefined) {
      updateData.startDate = Temporal.Instant.from(
        new Date(data.startDate).toISOString(),
      );
    }

    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate
        ? Temporal.Instant.from(
            new Date(data.endDate).toISOString(),
          )
        : null;
    }

    if (data.intervalValue !== undefined) {
      updateData.intervalValue = data.intervalValue;
    }

    if (data.intervalUnit !== undefined) {
      updateData.intervalUnit = data.intervalUnit;
    }

    if (data.daysOfWeek !== undefined) {
      updateData.daysOfWeek = data.daysOfWeek;
    }

    if (data.dayOfMonth !== undefined) {
      updateData.dayOfMonth = data.dayOfMonth;
    }

    if (data.timeOfDay !== undefined) {
      updateData.timeOfDay = data.timeOfDay;
    }

    if (data.timingTag !== undefined) {
      updateData.timingTag = data.timingTag;
    }

    return this.prisma.db.orm.public.Schedule
      .where({ id })
      .update(updateData);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.db.orm.public.Schedule
      .where({ id })
      .delete();
  }
}