// src/auth/auth.service.ts

import { Injectable } from '@nestjs/common';
import { db } from 'src/db';
import { users } from 'src/db/schema/users';
import { emailVerificationTokens } from 'src/db/schema/emailVerificationTokens';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  async signup(name: string, email: string, password: string) {
    // 1. hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. create user
    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
      })
      .returning();

    // 3. generate token
    const token = randomBytes(32).toString('hex');

    // 4. store token
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    });

    // 5. (TEMP) log verification link instead of sending email
    const verificationLink = `http://localhost:3000/auth/verify?token=${token}`;
    console.log('Verify email:', verificationLink);

    return {
      message: 'Signup successful. Please verify your email.',
    };
  }
}
