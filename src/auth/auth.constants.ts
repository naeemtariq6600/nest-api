import type { SignOptions } from 'jsonwebtoken';

export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'change-this-development-secret',
  expiresIn: (process.env.JWT_EXPIRES_IN ??
    '1d') as NonNullable<SignOptions['expiresIn']>,
};
