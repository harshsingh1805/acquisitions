import { z } from 'zod';

export const SignupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(255, 'Name must be at most 100 characters long')
    .trim(),
  email: z
    .email('Invalid email address')
    .max(255, 'Email must be at most 255 characters long')
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 8 characters long')
    .max(128, 'Password must be at most 128 characters long'),
  role: z.enum(['user', 'admin']).default('user'),
});

export const SigninSchema = z.object({
  email: z.string().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});
