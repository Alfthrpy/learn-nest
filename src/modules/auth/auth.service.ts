import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma/prisma.service';
import { PasswordUtil } from '@common/utils/password.util';
import { LoginDto } from './core/dto/login.dto';
import { RegisterDto } from './core/dto/register.dto';
import { AuthResponseDto } from './core/dto/auth-response.dto';
import { JwtPayload } from './core/interfaces/jwt-payload.interface';
import type { StringValue } from 'ms';

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthResponseDto['user'];
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private buildPayload(user: {
    id: number;
    email: string;
    position: {
      id: number;
      name: string;
      position_permissions: { permission: { name: string } }[];
    };
  }): JwtPayload {
    const permissions = user.position.position_permissions.map(
      (pp) => pp.permission.name,
    );

    return {
      userId: user.id,
      email: user.email,
      positionId: user.position.id,
      positionName: user.position.name,
      permissions,
    };
  }

  private buildTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn', '30d') as StringValue,
      }),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        position: {
          include: {
            position_permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await PasswordUtil.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = this.buildPayload(user);
    const { accessToken, refreshToken } = this.buildTokens(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        position: {
          id: user.position.id,
          name: user.position.name,
        },
        permissions: payload.permissions,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const { email, password, first_name, last_name, position_id } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const position = await this.prisma.position.findUnique({
      where: { id: position_id },
      include: {
        position_permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!position) {
      throw new BadRequestException('Invalid position ID');
    }

    const hashedPassword = await PasswordUtil.hash(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        first_name,
        last_name,
        position_id,
      },
      include: {
        position: {
          include: {
            position_permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const payload = this.buildPayload(user);
    const { accessToken, refreshToken } = this.buildTokens(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        position: {
          id: user.position.id,
          name: user.position.name,
        },
        permissions: payload.permissions,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        position: {
          include: {
            position_permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const freshPayload = this.buildPayload(user);
    const tokens = this.buildTokens(freshPayload);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        position: {
          id: user.position.id,
          name: user.position.name,
        },
        permissions: freshPayload.permissions,
      },
    };
  }
}
