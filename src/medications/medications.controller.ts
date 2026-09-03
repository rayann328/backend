import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { MedicationsService } from './medications.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('medications')
@UseGuards(AuthGuard)
export class MedicationsController {
  constructor(
    private readonly medicationsService: MedicationsService,
  ) {}

  @Get()
  findAll(@Req() req: any) {
    return this.medicationsService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.medicationsService.findOne(
      req.user.sub,
      id,
    );
  }

  @Post()
  create(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.medicationsService.create(
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
    return this.medicationsService.update(
      req.user.sub,
      id,
      body,
    );
  }

  @Patch(':id/archive')
  archive(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.medicationsService.archive(
      req.user.sub,
      id,
    );
  }

  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.medicationsService.remove(
      req.user.sub,
      id,
    );
  }
}