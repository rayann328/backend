import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MedicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.db.orm.public.Medication
      .where({ userId })
      .all();
  }

  async findOne(userId: string, id: string) {
    const medication = await this.prisma.db.orm.public.Medication.first({
      id,
      userId,
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    return medication;
  }

  async create(userId: string, data: {
    name: string;
    genericName?: string;
    brandName?: string;
    dosage?: string;
    strength?: string;
    type?: string;
    color?: string;
    shape?: string;
    notes?: string;
    photoUrl?: string;
  }) {
    return this.prisma.db.orm.public.Medication.create({
      userId,
      name: data.name,
      genericName: data.genericName ?? null,
      brandName: data.brandName ?? null,
      dosage: data.dosage ?? null,
      strength: data.strength ?? null,
      type: data.type ?? null,
      color: data.color ?? null,
      shape: data.shape ?? null,
      notes: data.notes ?? null,
      photoUrl: data.photoUrl ?? null,
    });
  }

  async update(
    userId: string,
    id: string,
    data: {
      name?: string;
      genericName?: string;
      brandName?: string;
      dosage?: string;
      strength?: string;
      type?: string;
      color?: string;
      shape?: string;
      notes?: string;
      photoUrl?: string;
      status?: 'ACTIVE' | 'ARCHIVED';
    },
  ) {
    await this.findOne(userId, id);

    return this.prisma.db.orm.public.Medication
      .where({
        id,
        userId,
      })
      .update(data);
  }

  async archive(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.db.orm.public.Medication
      .where({
        id,
        userId,
      })
      .update({
        status: 'ARCHIVED',
      });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.db.orm.public.Medication
      .where({
        id,
        userId,
      })
      .delete();
  }
}
