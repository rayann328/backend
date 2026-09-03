import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SchedulesService } from './schedules.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('schedules')
@UseGuards(AuthGuard)
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
  ) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('medicationId') medicationId?: string,
  ) {
    return this.schedulesService.findAll(
      req.user.sub,
      medicationId,
    );
  }

  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.schedulesService.findOne(
      req.user.sub,
      id,
    );
  }

  @Post()
  create(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.schedulesService.create(
      req.user.sub,
      body,
    );
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.schedulesService.update(
      req.user.sub,
      id,
      body,
    );
  }

  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.schedulesService.remove(
      req.user.sub,
      id,
    );
  }
}