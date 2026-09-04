import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get()
  getReport(@Req() req: any) {
    return this.reportsService.getReport(
      req.user.sub,
    );
  }
}