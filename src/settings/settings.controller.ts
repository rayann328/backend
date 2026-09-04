import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SettingsService } from './settings.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('settings')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
  ) {}

  @Get()
  getSettings(@Req() req: any) {
    return this.settingsService.getSettings(
      req.user.sub,
    );
  }

  @Patch()
  updateSettings(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.settingsService.updateSettings(
      req.user.sub,
      body,
    );
  }
}