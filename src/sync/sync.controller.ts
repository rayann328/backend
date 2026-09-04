import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SyncService } from './sync.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('sync')
@UseGuards(AuthGuard)
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
  ) {}

  @Get()
  sync(@Req() req: any) {
    return this.syncService.syncUser(
      req.user.sub,
    );
  }
}