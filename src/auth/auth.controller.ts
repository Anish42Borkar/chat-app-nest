// src/auth/auth.controller.ts

import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import type { Response } from 'express';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req) {
    return req.user;
  }

  @Public()
  @Post('login')
  async login(@Res() res: Response, @Body() body: LoginDto) {
    const { email, password } = body;
    const token = await this.authService.login(email, password);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      domain: '.quickchat.local',
    });

    return res.json({ message: 'Login success' });
  }

  @Public()
  @Post('signup')
  signup(@Body() body: any) {
    const { name, email, password } = body;
    return this.authService.signup(name, email, password);
  }

  @Public()
  @Get('verify')
  verify(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}
