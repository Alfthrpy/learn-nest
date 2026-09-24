import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AuthService } from '../../auth.service';
import { LoginDto } from '../../core/dto/login.dto';
import { RegisterDto } from '../../core/dto/register.dto';
import { AuthResponseDto } from '../../core/dto/auth-response.dto';
import { Public } from '@common/decorators/public.decorator';
import { ApiSuccessResponse } from '@common/decorators/api-response.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { JwtRefreshGuard } from '../../core/guards/jwt-refresh.guard';
import { JwtPayload } from '../../core/interfaces/jwt-payload.interface';

const durationToMs = (duration: string): number => {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * unitMs[match[2]];
};

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const maxAge = durationToMs(process.env.JWT_EXPIRATION || '7d');
    const refreshMaxAge = durationToMs(process.env.JWT_REFRESH_EXPIRATION || '30d');
    const secure = process.env.NODE_ENV === 'production';

    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge,
    });

    res.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: refreshMaxAge,
    });
  }

  private clearAuthCookies(res: Response) {
    const secure = process.env.NODE_ENV === 'production';

    res.cookie('Authentication', '', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      expires: new Date(0),
    });

    res.cookie('Refresh', '', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
      expires: new Date(0),
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login (session via httpOnly cookies)' })
  @ApiCookieAuth('Authentication')
  @ApiSuccessResponse(AuthResponseDto)
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, refreshToken, user } = await this.authService.login(loginDto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'User registration (session via httpOnly cookies)' })
  @ApiCookieAuth('Authentication')
  @ApiSuccessResponse(AuthResponseDto)
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, refreshToken, user } = await this.authService.register(registerDto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Public()
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh session (rotates access & refresh cookies)' })
  @ApiCookieAuth('Refresh')
  @ApiSuccessResponse(AuthResponseDto)
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const payload = req.user as JwtPayload;
    const { accessToken, refreshToken, user } = await this.authService.refresh(
      (req.cookies as any).Refresh,
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout (clears session cookies)' })
  @ApiSuccessResponse(AuthResponseDto)
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookies(res);
    return { message: 'Logout successful' };
  }
}
