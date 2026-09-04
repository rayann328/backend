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

import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll(@Req() req: any) {
    return this.notificationsService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.notificationsService.findOne(
      req.user.sub,
      id,
    );
  }

  @Post()
  create(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.notificationsService.create(
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
    return this.notificationsService.update(
      req.user.sub,
      id,
      body,
    );
  }

  @Patch(':id/read')
  markAsRead(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(
      req.user.sub,
      id,
    );
  }

  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.notificationsService.remove(
      req.user.sub,
      id,
    );
  }
}