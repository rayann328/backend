import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // =========================
  // REGISTER
  // =========================

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  // =========================
  // LOGIN
  // =========================

  @Post('login')
  async login(
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  // =========================
  // FORGOT PASSWORD
  // =========================

  @Post('forgot-password')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(dto);
  }

  // =========================
  // RESET PASSWORD
  // =========================

  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(dto);
  }

  // =========================
  // VERIFY EMAIL
  // =========================

  @Post('verify-email')
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
  ) {
    return (this.authService as any).verifyEmail(dto);
  }

  // =========================
  // GET CURRENT USER
  // =========================

  @UseGuards(AuthGuard)
  @Get('me')
  async me(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.authService.getMe(
      request.user.sub,
    );
  }
}