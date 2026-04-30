// src/auth/auth.service.ts

import { Injectable, NotFoundException, Res } from '@nestjs/common';
import { db } from 'src/db';
import { users } from 'src/db/schema/users';
import { emailVerificationTokens } from 'src/db/schema/emailVerificationTokens';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  async login(email: string, password: string) {
    // 1. find user
    const result = await db.execute(sql`
    SELECT *
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `);

    const user = result.rows[0];

    if (!user) {
      throw new NotFoundException({ message: 'Invalid credentials' });
    }

    // 2. check password
    const isMatch = await bcrypt.compare(password, user.password as string);

    if (!isMatch) {
      throw new NotFoundException({ message: 'Invalid credentials' });
    }

    // 3. check email verification
    if (!user.is_verified) {
      return { message: 'Please verify your email first' };
    }

    // 4. generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

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
      verificationLink,
    };
  }

  async verifyEmail(token: string) {
    // 1. find token
    const result = await db.execute(sql`
    SELECT *
    FROM email_verification_tokens
    WHERE token = ${token}
    LIMIT 1
  `);

    const record = result.rows[0];

    if (!record) {
      return { message: 'Invalid token' };
    }

    // 2. check expiry
    if (
      typeof record.expires_at === 'string' ||
      typeof record.expires_at === 'number' ||
      record.expires_at instanceof Date
    ) {
      if (new Date(record.expires_at as string).getTime() < Date.now()) {
        console.log(new Date(record.expires_at), ' = ', new Date());
        return { message: 'Token expired' };
      }
    } else {
      return { message: 'Invalid expires_at type' };
    }

    console.log(
      new Date(record.expires_at as string).getTime(),
      ' = ',
      Date.now(),
    );

    // 3. mark user verified
    await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, Number(record.user_id)));

    // 4. delete token
    await db.execute(sql`
    DELETE FROM email_verification_tokens
    WHERE id = ${record.id}
  `);

    return { message: 'Email verified successfully' };
  }
}
