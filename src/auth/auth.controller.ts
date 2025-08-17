import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiOperation,
  ApiOkResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AuthResponse } from './dto/auth.dto';
import { LoginRequest } from './dto/login.dto';
import { RegisterRequest } from './dto/register.dto';
import { Response, Request } from 'express';
import { Authorization } from './decorators/http/authorization.decorator';
import { Authorized } from './decorators/http/authorized.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Profile creating',
    description: 'Creates new account',
  })
  @ApiOkResponse({ type: AuthResponse })
  @ApiConflictResponse({ description: 'User already exists' })
  @ApiBadRequestResponse({ description: 'invalid incoming data' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED) //status = 201
  async create(
    @Res({ passthrough: true }) res: Response, //so no need to res.json()
    @Body() dto: RegisterRequest,
  ) {
    return await this.authService.register(res, dto);
  }

  @ApiOperation({
    summary: 'Profile entering',
    description: 'Enters in existing account',
  })
  @ApiOkResponse({ type: AuthResponse })
  @ApiBadRequestResponse({ description: 'invalid incoming data' })
  @ApiNotFoundResponse({ description: 'user not found' })
  @Post('login')
  @HttpCode(HttpStatus.OK) //status = 201
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginRequest,
  ) {
    return await this.authService.login(res, dto);
  }

  @ApiOperation({
    summary: 'Refreshes token',
    description: 'talks for itself',
  })
  @ApiOkResponse({ type: AuthResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK) //status = 201
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.refresh(req, res);
  }

  @ApiOperation({
    summary: 'Exit of account',
    description: 'Logout typeshi',
  })
  @Post('logout')
  @HttpCode(HttpStatus.OK) //status = 201
  async logout(@Res({ passthrough: true }) res: Response) {
    return await this.authService.logout(res);
  }

  //@UseGuards(AuthGuard('jwt'))
  @Authorization()
  @Get('@me')
  @HttpCode(HttpStatus.OK)
  async me(@Authorized() user: User) {
    return user;
  }
}
