import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@Req() request: AuthenticatedRequest) {
    return this.usersService.getMe(request.user.sub);
  }

  @Patch('me')
  async updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.usersService.updateMe(request.user.sub, body);
  }

  @Delete('me')
  async deleteMe(@Req() request: AuthenticatedRequest) {
    return this.usersService.deleteMe(request.user.sub);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
