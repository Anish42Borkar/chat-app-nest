import { Request } from 'express';
import { AuthUserT } from './auth.types';

export interface AuthRequest extends Request {
  user: AuthUserT;
  jwtToken: string;
}
