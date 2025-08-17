import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginRequest } from './dto/login.dto';
import { RegisterRequest } from './dto/register.dto';
import { hash, verify } from 'argon2';
import { JwtPayload } from './interface/jwt.interface';
import { Request, Response } from 'express';
import { IsDev } from 'src/utils/is-dev.util';

@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_TOKEN_TTL: string;
  private readonly JWT_REFRESH_TOKEN_TTL: string;

  private readonly COOKIE_DOMAIN: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService, //for env access
    private readonly jwtService: JwtService,
  ) {
    this.JWT_ACCESS_TOKEN_TTL = configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_TTL',
    );
    this.JWT_REFRESH_TOKEN_TTL = configService.getOrThrow<string>(
      'JWT_REFRESH_TOKEN_TTL',
    );

    this.COOKIE_DOMAIN = configService.getOrThrow<string>('COOKIE_DOMAIN');
  }

  async register(res: Response, dto: RegisterRequest) {
    const { name, email, password } = dto;

    const existUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (existUser) {
      throw new ConflictException('User already exists');
    }

    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        password: await hash(password),
      },
    });

    return this.auth(res, user.id, user.role);
  }

  async login(res: Response, dto: LoginRequest) {
    const { email, password } = dto;

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValidPassword = await verify(user.password, password);

    if (isValidPassword) {
      throw new NotFoundException('User not found'); //same so to confuse bad guys
    }

    return this.auth(res, user.id, user.role);
  }

  private auth(res: Response, id: string, role: string) {
    const { accessToken, refreshToken } = this.generateTokens(id, role);

    this.setCookie(res, refreshToken, new Date(Date.now() + 60 * 60 * 24 * 7)); // better make util to get from env '7d'

    return { accessToken };
  }

  async validate(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private generateTokens(id: string, role: string) {
    const payload: JwtPayload = { id, role };

    const accessToken = this.jwtService.sign(payload, {
      //algorithm: declared in config
      expiresIn: this.JWT_ACCESS_TOKEN_TTL,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_REFRESH_TOKEN_TTL,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid token');
    }

    const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken); //extract data

    if (payload) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: payload.id,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (!user) {
        throw new NotFoundException('user Not Found');
      }

      return this.auth(res, user.id, user.role);
    }
  }

  private setCookie(res: Response, value: string, expires: Date) {
    res.cookie('refreshToken', value, {
      httpOnly: true, //only server can
      domain: this.COOKIE_DOMAIN,
      expires,
      secure: !IsDev(this.configService), //https or not
      sameSite: IsDev(this.configService) ? 'none' : 'lax',
    });
  }

  async logout(res: Response) {
    this.setCookie(res, 'refreshToken', new Date(0));
  }
}
