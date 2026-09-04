import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { RemindersService } from './reminders.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('reminders')
@UseGuards(AuthGuard)
export class RemindersController {
  constructor(
    private readonly remindersService: RemindersService,
  ) {}

  @Get('upcoming')
  async getUpcoming(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 20;

    if (
      Number.isNaN(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      throw new BadRequestException(
        'limit must be between 1 and 100',
      );
    }

    return this.remindersService.getUpcoming(
      req.user.sub,
      parsedLimit,
    );
  }

  @Get('today')
  async getToday(@Req() req: any) {
    return this.remindersService.getToday(
      req.user.sub,
    );
  }

  @Get('range')
  async getRange(
    @Req() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException(
        'from and to are required',
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDate.getTime())
    ) {
      throw new BadRequestException(
        'from and to must be valid dates',
      );
    }

    if (fromDate > toDate) {
      throw new BadRequestException(
        'from must be before to',
      );
    }

    return this.remindersService.getByDateRange(
      req.user.sub,
      fromDate,
      toDate,
    );
  }

  @Get(':id')
  async getOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.remindersService.getOne(
      req.user.sub,
      id,
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Query('status') status: string,
    @Query('note') note?: string,
  ) {
    const allowedStatuses = [
      'TAKEN',
      'SKIPPED',
      'DELAYED',
      'MISSED',
      'PENDING',
    ];

    const normalizedStatus = status?.toUpperCase();

    if (!allowedStatuses.includes(normalizedStatus)) {
      throw new BadRequestException(
        `status must be one of: ${allowedStatuses.join(', ')}`,
      );
    }

    return this.remindersService.updateStatus(
      req.user.sub,
      id,
      normalizedStatus as
        | 'TAKEN'
        | 'SKIPPED'
        | 'DELAYED'
        | 'MISSED'
        | 'PENDING',
      note,
    );
  }
}