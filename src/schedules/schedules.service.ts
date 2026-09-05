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
        .where({
          medicationId,
        })
        .all();
    }

    const medications =
      await this.prisma.db.orm.public.Medication
        .where({
          userId,
        })
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
      throw new NotFoundException(
        'Medication not found',
      );
    }

    const startDate = new Date(data.startDate);

    if (Number.isNaN(startDate.getTime())) {
      throw new Error('Invalid schedule start date');
    }

    const endDate = data.endDate
      ? new Date(data.endDate)
      : null;

    if (
      endDate &&
      Number.isNaN(endDate.getTime())
    ) {
      throw new Error('Invalid schedule end date');
    }

    const schedule =
      await this.prisma.db.orm.public.Schedule.create({
        medicationId: data.medicationId,
        scheduleType: data.scheduleType,

        startDate:
          Temporal.Instant.from(
            startDate.toISOString(),
          ),

        endDate:
          endDate
            ? Temporal.Instant.from(
                endDate.toISOString(),
              )
            : null,

        intervalValue:
          data.intervalValue ?? null,

        intervalUnit:
          data.intervalUnit ?? null,

        daysOfWeek:
          data.daysOfWeek ?? null,

        dayOfMonth:
          data.dayOfMonth ?? null,

        timeOfDay:
          data.timeOfDay ?? null,

        timingTag:
          data.timingTag ?? null,
      });

    // Generate the DoseLogs immediately.
    // These are what Dashboard, Schedule,
    // Reminders and Calendar display.
    await this.generateDoseLogs(
      userId,
      data.medicationId,
      schedule.id,
      {
        ...data,
        startDate,
        endDate: endDate ?? undefined,
      },
    );

    return schedule;
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
      updateData.scheduleType =
        data.scheduleType;
    }

    if (data.startDate !== undefined) {
      updateData.startDate =
        Temporal.Instant.from(
          new Date(data.startDate).toISOString(),
        );
    }

    if (data.endDate !== undefined) {
      updateData.endDate =
        data.endDate
          ? Temporal.Instant.from(
              new Date(data.endDate).toISOString(),
            )
          : null;
    }

    if (data.intervalValue !== undefined) {
      updateData.intervalValue =
        data.intervalValue;
    }

    if (data.intervalUnit !== undefined) {
      updateData.intervalUnit =
        data.intervalUnit;
    }

    if (data.daysOfWeek !== undefined) {
      updateData.daysOfWeek =
        data.daysOfWeek;
    }

    if (data.dayOfMonth !== undefined) {
      updateData.dayOfMonth =
        data.dayOfMonth;
    }

    if (data.timeOfDay !== undefined) {
      updateData.timeOfDay =
        data.timeOfDay;
    }

    if (data.timingTag !== undefined) {
      updateData.timingTag =
        data.timingTag;
    }

    return this.prisma.db.orm.public.Schedule
      .where({
        id,
      })
      .update(updateData);
  }

  async remove(
    userId: string,
    id: string,
  ) {
    await this.findOne(userId, id);

    return this.prisma.db.orm.public.Schedule
      .where({
        id,
      })
      .delete();
  }

  private async generateDoseLogs(
    userId: string,
    medicationId: string,
    scheduleId: string,
    data: {
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
    },
  ) {
    const startDate =
      data.startDate instanceof Date
        ? new Date(data.startDate)
        : new Date(data.startDate);

    if (Number.isNaN(startDate.getTime())) {
      throw new Error(
        'Invalid schedule start date',
      );
    }

    const endDate = data.endDate
      ? new Date(data.endDate)
      : null;

    if (
      endDate &&
      Number.isNaN(endDate.getTime())
    ) {
      throw new Error(
        'Invalid schedule end date',
      );
    }

    const getTime = () => {
      if (
        !data.timeOfDay ||
        !data.timeOfDay.trim()
      ) {
        return {
          hour: startDate.getHours(),
          minute: startDate.getMinutes(),
        };
      }

      const parts =
        data.timeOfDay.split(':');

      const hour =
        Number(parts[0]);

      const minute =
        Number(parts[1] ?? 0);

      return {
        hour:
          Number.isNaN(hour)
            ? startDate.getHours()
            : hour,

        minute:
          Number.isNaN(minute)
            ? startDate.getMinutes()
            : minute,
      };
    };

    const {
      hour,
      minute,
    } = getTime();

    // ONE TIME
    if (
      data.scheduleType ===
      'ONE_TIME'
    ) {
      const scheduledAt =
        new Date(startDate);

      scheduledAt.setHours(
        hour,
        minute,
        0,
        0,
      );

      await this.createDoseLog(
        userId,
        medicationId,
        scheduleId,
        scheduledAt,
      );

      return;
    }

    // Generate recurring doses
    // for the next 30 days.
    const generationEnd =
      new Date(startDate);

    generationEnd.setDate(
      generationEnd.getDate() + 30,
    );

    if (
      endDate &&
      endDate < generationEnd
    ) {
      generationEnd.setTime(
        endDate.getTime(),
      );
    }

    // DAILY
    if (
      data.scheduleType ===
      'DAILY'
    ) {
      const current =
        new Date(startDate);

      current.setHours(
        hour,
        minute,
        0,
        0,
      );

      while (
        current <= generationEnd
      ) {
        if (
          !endDate ||
          current <= endDate
        ) {
          await this.createDoseLog(
            userId,
            medicationId,
            scheduleId,
            new Date(current),
          );
        }

        current.setDate(
          current.getDate() + 1,
        );
      }

      return;
    }

    // WEEKLY
    if (
      data.scheduleType ===
      'WEEKLY'
    ) {
      const selectedDays =
        this.parseDaysOfWeek(
          data.daysOfWeek,
        );

      const current =
        new Date(startDate);

      current.setHours(
        hour,
        minute,
        0,
        0,
      );

      while (
        current <= generationEnd
      ) {
        const day =
          current.getDay();

        const shouldCreate =
          selectedDays.isEmpty
            ? day ===
              startDate.getDay()
            : selectedDays.contains(day);

        if (
          shouldCreate &&
          (!endDate ||
            current <= endDate)
        ) {
          await this.createDoseLog(
            userId,
            medicationId,
            scheduleId,
            new Date(current),
          );
        }

        current.setDate(
          current.getDate() + 1,
        );
      }

      return;
    }

    // MONTHLY
    if (
      data.scheduleType ===
      'MONTHLY'
    ) {
      const current =
        new Date(startDate);

      current.setHours(
        hour,
        minute,
        0,
        0,
      );

      while (
        current <= generationEnd
      ) {
        if (
          !endDate ||
          current <= endDate
        ) {
          await this.createDoseLog(
            userId,
            medicationId,
            scheduleId,
            new Date(current),
          );
        }

        current.setMonth(
          current.getMonth() + 1,
        );
      }

      return;
    }

    // INTERVAL
    if (
      data.scheduleType ===
      'INTERVAL'
    ) {
      const interval =
        Number(
          data.intervalValue,
        );

      if (
        !interval ||
        interval < 1
      ) {
        return;
      }

      const unit =
        (
          data.intervalUnit ??
          'DAY'
        ).toUpperCase();

      const current =
        new Date(startDate);

      current.setHours(
        hour,
        minute,
        0,
        0,
      );

      while (
        current <= generationEnd
      ) {
        if (
          !endDate ||
          current <= endDate
        ) {
          await this.createDoseLog(
            userId,
            medicationId,
            scheduleId,
            new Date(current),
          );
        }

        if (
          unit === 'HOUR' ||
          unit === 'HOURS'
        ) {
          current.setHours(
            current.getHours() +
              interval,
          );
        } else if (
          unit === 'WEEK' ||
          unit === 'WEEKS'
        ) {
          current.setDate(
            current.getDate() +
              interval * 7,
          );
        } else if (
          unit === 'MONTH' ||
          unit === 'MONTHS'
        ) {
          current.setMonth(
            current.getMonth() +
              interval,
          );
        } else {
          current.setDate(
            current.getDate() +
              interval,
          );
        }
      }

      return;
    }

    // CUSTOM
    // Currently treated as daily.
    if (
      data.scheduleType ===
      'CUSTOM'
    ) {
      const current =
        new Date(startDate);

      current.setHours(
        hour,
        minute,
        0,
        0,
      );

      while (
        current <= generationEnd
      ) {
        if (
          !endDate ||
          current <= endDate
        ) {
          await this.createDoseLog(
            userId,
            medicationId,
            scheduleId,
            new Date(current),
          );
        }

        current.setDate(
          current.getDate() + 1,
        );
      }
    }
  }

  private async createDoseLog(
    userId: string,
    medicationId: string,
    scheduleId: string,
    scheduledAt: Date,
  ) {
    await this.prisma.db.orm.public.DoseLog.create(
      {
        userId,
        medicationId,
        scheduleId,
        scheduledAt:
          Temporal.Instant.from(
            scheduledAt.toISOString(),
          ),
        status: 'PENDING',
        takenAt: null,
        note: null,
      },
    );
  }

  private parseDaysOfWeek(
    value?: string,
  ): {
    isEmpty: boolean;
    contains: (
      day: number,
    ) => boolean;
  } {
    if (
      !value ||
      !value.trim()
    ) {
      return {
        isEmpty: true,
        contains: () => false,
      };
    }

    const map: Record<
      string,
      number
    > = {
      SUNDAY: 0,
      SUN: 0,
      MONDAY: 1,
      MON: 1,
      TUESDAY: 2,
      TUE: 2,
      WEDNESDAY: 3,
      WED: 3,
      THURSDAY: 4,
      THU: 4,
      FRIDAY: 5,
      FRI: 5,
      SATURDAY: 6,
      SAT: 6,
    };

    const days =
      value
        .split(',')
        .map(
          (item) =>
            map[
              item
                .trim()
                .toUpperCase()
            ],
        )
        .filter(
          (day) =>
            day !== undefined,
        );

    if (days.length === 0) {
      return {
        isEmpty: true,
        contains: () => false,
      };
    }

    return {
      isEmpty: false,
      contains: (
        day: number,
      ) => days.includes(day),
    };
  }
}