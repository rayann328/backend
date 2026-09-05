import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Temporal } from '@js-temporal/polyfill';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const doseLogs =
      await this.prisma.db.orm.public.DoseLog
        .where({ userId })
        .all();

    const medications =
      await this.prisma.db.orm.public.Medication
        .where({ userId })
        .all();

    const medicationMap = new Map(
      medications.map((medication) => [
        String(medication.id),
        medication,
      ]),
    );

    // Only completed actions belong in History.
    const completed = doseLogs
      .filter((dose) => {
        const status =
          dose.status
            ?.toString()
            .toUpperCase();

        return (
          status === 'TAKEN' ||
          status === 'SKIPPED' ||
          status === 'DELAYED' ||
          status === 'MISSED'
        );
      })
      .map((dose) => {
        const medication =
          medicationMap.get(
            String(dose.medicationId),
          );

        return {
          ...dose,
          medication: medication
            ? {
                id: medication.id,
                name: medication.name,
              }
            : null,
        };
      });

    // Keep only the latest completed action
    // for each medication.
    const latestByMedication =
      new Map<string, any>();

   for (const finalDose of completed) {
      const medicationId =
        String(finalDose.medicationId);

      const existing =
        latestByMedication.get(
          medicationId,
        );

      if (!existing) {
        latestByMedication.set(
          medicationId,
          finalDose,
        );
        continue;
      }

      const currentTime =
        new Date(
          String(finalDose.scheduledAt),
        ).getTime();

      const existingTime =
        new Date(
          String(existing.scheduledAt),
        ).getTime();

      if (
        currentTime > existingTime
      ) {
        latestByMedication.set(
          medicationId,
          finalDose,
        );
      }
    }

    return Array.from(
      latestByMedication.values(),
    ).sort((a, b) => {
      const dateA =
        new Date(
          String(a.scheduledAt),
        ).getTime();

      const dateB =
        new Date(
          String(b.scheduledAt),
        ).getTime();

      return dateB - dateA;
    });
  }

  async findOne(
    userId: string,
    id: string,
  ) {
    const doseLog =
      await this.prisma.db.orm.public.DoseLog.first({
        id,
        userId,
      });

    if (!doseLog) {
      throw new NotFoundException(
        'Dose log not found',
      );
    }

    return doseLog;
  }

  async create(
    userId: string,
    data: {
      medicationId: string;
      scheduleId?: string;
      scheduledAt: Date | string;
      status?:
        | 'TAKEN'
        | 'SKIPPED'
        | 'DELAYED'
        | 'MISSED'
        | 'PENDING';
      takenAt?: Date | string;
      note?: string;
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

    if (data.scheduleId) {
      const schedule =
        await this.prisma.db.orm.public.Schedule.first({
          id: data.scheduleId,
          medicationId:
            data.medicationId,
        });

      if (!schedule) {
        throw new NotFoundException(
          'Schedule not found',
        );
      }
    }

    return this.prisma.db.orm.public.DoseLog.create({
      userId,
      medicationId:
        data.medicationId,
      scheduleId:
        data.scheduleId ?? null,

      scheduledAt:
        Temporal.Instant.from(
          new Date(
            data.scheduledAt,
          ).toISOString(),
        ),

      status:
        data.status ?? 'PENDING',

      takenAt: data.takenAt
        ? Temporal.Instant.from(
            new Date(
              data.takenAt,
            ).toISOString(),
          )
        : null,

      note:
        data.note ?? null,
    });
  }

  async update(
    userId: string,
    id: string,
    data: {
      status?:
        | 'TAKEN'
        | 'SKIPPED'
        | 'DELAYED'
        | 'MISSED'
        | 'PENDING';
      takenAt?: Date | string | null;
      note?: string | null;
    },
  ) {
    await this.findOne(
      userId,
      id,
    );

    const updateData: any = {};

    if (
      data.status !== undefined
    ) {
      updateData.status =
        data.status;
    }

    if (
      data.takenAt !== undefined
    ) {
      updateData.takenAt =
        data.takenAt
          ? Temporal.Instant.from(
              new Date(
                data.takenAt,
              ).toISOString(),
            )
          : null;
    }

    if (
      data.note !== undefined
    ) {
      updateData.note =
        data.note;
    }

    return this.prisma.db.orm.public.DoseLog
      .where({
        id,
        userId,
      })
      .update(updateData);
  }

  async remove(
    userId: string,
    id: string,
  ) {
    await this.findOne(
      userId,
      id,
    );

    return this.prisma.db.orm.public.DoseLog
      .where({
        id,
        userId,
      })
      .delete();
  }
}