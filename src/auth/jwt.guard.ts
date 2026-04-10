import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from './public.decorator';
import { AuthUserT } from 'src/common/types/auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    let token;

    if (request.cookies?.token?.token) {
      token = request.cookies?.token?.token;
    } else {
      token = authHeader.split(' ')[1]; // Bearer TOKEN
    }

    console.log('request.cookies?.token : ', token);

    if (!token) {
      throw new Error('No token provided');
    }

    // if (!token) {
    //   throw new Error('Invalid token');
    // }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      console.log(decoded, ' decoded');
      request.user = decoded as AuthUserT; // attach user to request
      request.jwtToken = token;
      return true;
    } catch (err) {
      console.log('Unauthorized\n\n\n\n');

      console.log(err);
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
