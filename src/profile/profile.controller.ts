import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ProfileService } from './profile.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
  ) {}

  @Get()
  getProfile(@Req() req: any) {
    return this.profileService.getProfile(
      req.user.sub,
    );
  }

  @Patch()
  updateProfile(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.profileService.updateProfile(
      req.user.sub,
      body,
    );
  }

  @Patch('password')
  changePassword(
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.profileService.changePassword(
      req.user.sub,
      body,
    );
  }
}