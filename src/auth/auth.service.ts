import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import {
  createHash,
  randomBytes,
} from 'crypto';

import { Temporal } from '@js-temporal/polyfill';

import { PrismaService } from '../prisma/prisma.service';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // =====================================================
  // REGISTER
  // =====================================================

  async register(dto: RegisterDto) {
    const email =
      dto.email.trim().toLowerCase();

    // Check if email already exists
    const existingUser =
      await this.prisma.db.orm.public.User.first({
        email,
      });

    if (existingUser) {
      throw new ConflictException(
        'Email is already registered',
      );
    }

    // Hash password
    const passwordHash =
      await bcrypt.hash(
        dto.password,
        12,
      );

    // Create user
    const user =
      await this.prisma.db.orm.public.User.create({
        email,
        passwordHash,
        firstName:
          dto.firstName?.trim() || null,
        lastName:
          dto.lastName?.trim() || null,
        phone:
          dto.phone?.trim() || null,
      });

    // =================================================
    // CREATE EMAIL VERIFICATION TOKEN
    // =================================================

    const rawVerificationToken =
      randomBytes(32).toString('hex');

    const verificationTokenHash =
      createHash('sha256')
        .update(rawVerificationToken)
        .digest('hex');

    const verificationExpiresAt =
      Temporal.Instant.from(
        new Date(
          Date.now() +
            24 * 60 * 60 * 1000,
        ).toISOString(),
      );

    await (
      this.prisma.db.orm.public as any
    ).EmailVerification.create({
      userId: user.id,
      tokenHash:
        verificationTokenHash,
      expiresAt:
        verificationExpiresAt,
      used: false,
    });

    // =================================================
    // CREATE JWT
    // =================================================

    const accessToken =
      await this.createAccessToken(
        user,
      );

    // =================================================
    // RESPONSE
    // =================================================

    return {
      message:
        'Registration successful',

      access_token:
        accessToken,

      // DEVELOPMENT / TESTING ONLY
      verificationToken:
        rawVerificationToken,

      verificationExpiresInHours:
        24,

      user:
        this.safeUser(user),
    };
  }

  // =====================================================
  // LOGIN
  // =====================================================

  async login(dto: LoginDto) {
    const email =
      dto.email.trim().toLowerCase();

    const user =
      await this.prisma.db.orm.public.User.first({
        email,
      });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        dto.password,
        user.passwordHash,
      );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const accessToken =
      await this.createAccessToken(
        user,
      );

    return {
      message:
        'Login successful',

      access_token:
        accessToken,

      user:
        this.safeUser(user),
    };
  }

  // =====================================================
  // GET CURRENT USER
  // =====================================================

  async getMe(userId: string) {
    const user =
      await this.prisma.db.orm.public.User.first({
        id: userId,
      });

    if (!user) {
      throw new UnauthorizedException(
        'User not found',
      );
    }

    return this.safeUser(user);
  }

  // =====================================================
  // FORGOT PASSWORD
  // =====================================================

  async forgotPassword(
    dto: ForgotPasswordDto,
  ) {
    const email =
      dto.email.trim().toLowerCase();

    const user =
      await this.prisma.db.orm.public.User.first({
        email,
      });

    // Don't reveal whether email exists
    if (!user) {
      return {
        message:
          'If the email is registered, a password reset request has been created.',
      };
    }

    // Invalidate previous tokens
    const oldTokens =
      await this.prisma.db.orm.public.PasswordReset
        .where({
          userId: user.id,
          used: false,
        })
        .all();

    for (const token of oldTokens) {
      await this.prisma.db.orm.public.PasswordReset
        .where({
          id: token.id,
        })
        .update({
          used: true,
        });
    }

    // Generate token
    const rawToken =
      randomBytes(32).toString('hex');

    const tokenHash =
      createHash('sha256')
        .update(rawToken)
        .digest('hex');

    // 30 minute expiration
    const expiresAt =
      Temporal.Instant.from(
        new Date(
          Date.now() +
            30 * 60 * 1000,
        ).toISOString(),
      );

    await this.prisma.db.orm.public.PasswordReset
      .create({
        userId: user.id,
        tokenHash,
        expiresAt,
        used: false,
      });

    return {
      message:
        'Password reset request created',

      // DEVELOPMENT / TESTING ONLY
      resetToken:
        rawToken,

      expiresInMinutes:
        30,
    };
  }

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  async resetPassword(
    dto: ResetPasswordDto,
  ) {
    const tokenHash =
      createHash('sha256')
        .update(dto.token)
        .digest('hex');

    const resetRequest =
      await this.prisma.db.orm.public.PasswordReset
        .first({
          tokenHash,
        });

    if (!resetRequest) {
      throw new UnauthorizedException(
        'Invalid or expired reset token',
      );
    }

    if (resetRequest.used) {
      throw new UnauthorizedException(
        'Invalid or expired reset token',
      );
    }

    const expiresAt =
      this.toTimestamp(
        resetRequest.expiresAt,
      );

    if (
      expiresAt <=
      Date.now()
    ) {
      await this.prisma.db.orm.public.PasswordReset
        .where({
          id: resetRequest.id,
        })
        .update({
          used: true,
        });

      throw new UnauthorizedException(
        'Invalid or expired reset token',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        dto.newPassword,
        12,
      );

    // Update password
    await this.prisma.db.orm.public.User
      .where({
        id: resetRequest.userId,
      })
      .update({
        passwordHash,
      });

    // Make token unusable
    await this.prisma.db.orm.public.PasswordReset
      .where({
        id: resetRequest.id,
      })
      .update({
        used: true,
      });

    return {
      message:
        'Password reset successful',
    };
  }

  // =====================================================
  // VERIFY EMAIL
  // =====================================================

  async verifyEmail(
    dto: VerifyEmailDto,
  ) {
    const tokenHash =
      createHash('sha256')
        .update(dto.token)
        .digest('hex');

    // Find verification record
    const verification =
      await this.prisma.db.orm.public.EmailVerification
        .first({
          tokenHash,
        });

    if (!verification) {
      throw new UnauthorizedException(
        'Invalid or expired verification token',
      );
    }

    // Check if already used
    if (verification.used) {
      throw new UnauthorizedException(
        'Invalid or expired verification token',
      );
    }

    // Check expiration
    const expiresAt =
      this.toTimestamp(
        verification.expiresAt,
      );

    if (
      expiresAt <=
      Date.now()
    ) {
      await this.prisma.db.orm.public.EmailVerification
        .where({
          id: verification.id,
        })
        .update({
          used: true,
        });

      throw new UnauthorizedException(
        'Invalid or expired verification token',
      );
    }

    // Mark email as verified
    await this.prisma.db.orm.public.User
      .where({
        id: verification.userId,
      })
      .update({
        emailVerified: true,
      });

    // Make verification token unusable
    await this.prisma.db.orm.public.EmailVerification
      .where({
        id: verification.id,
      })
      .update({
        used: true,
      });

    return {
      message:
        'Email verified successfully',
    };
  }

  // =====================================================
  // CONVERT TIMESTAMP
  // =====================================================

  private toTimestamp(
    value: unknown,
  ): number {
    if (
      value instanceof Temporal.Instant
    ) {
      return Number(
        value.epochMilliseconds,
      );
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    return new Date(
      String(value),
    ).getTime();
  }

  // =====================================================
  // CREATE JWT
  // =====================================================

  private async createAccessToken(
    user: {
      id: string;
      email: string;
      role: string;
    },
  ) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  // =====================================================
  // SAFE USER RESPONSE
  // =====================================================

  private safeUser(
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      dateOfBirth: Date | null;
      role: string;
      emailVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    return {
      id: user.id,
      email: user.email,
      firstName:
        user.firstName,
      lastName:
        user.lastName,
      phone:
        user.phone,
      dateOfBirth:
        user.dateOfBirth,
      role:
        user.role,
      emailVerified:
        user.emailVerified,
      createdAt:
        user.createdAt,
      updatedAt:
        user.updatedAt,
    };
  }
}