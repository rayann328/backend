import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(userId: string) {
    const doseLogs =
      await this.prisma.db.orm.public.DoseLog
        .where({ userId })
        .all();

    const totalDoses = doseLogs.length;

    const taken = doseLogs.filter(
      (dose) => dose.status === 'TAKEN',
    ).length;

    const skipped = doseLogs.filter(
      (dose) => dose.status === 'SKIPPED',
    ).length;

    const delayed = doseLogs.filter(
      (dose) => dose.status === 'DELAYED',
    ).length;

    const missed = doseLogs.filter(
      (dose) => dose.status === 'MISSED',
    ).length;

    const pending = doseLogs.filter(
      (dose) => dose.status === 'PENDING',
    ).length;

    const completedDoses = taken;

    const adherencePercentage =
      totalDoses > 0
        ? Math.round(
            (completedDoses / totalDoses) * 100,
          )
        : 0;

    return {
      totalDoses,
      taken,
      skipped,
      delayed,
      missed,
      pending,
      adherencePercentage,
    };
  }
}