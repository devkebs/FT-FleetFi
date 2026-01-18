import { z } from 'zod';

// Password validation regex - matches backend requirements
// Requires: min 12 chars, uppercase, lowercase, number, special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_])[A-Za-z\d@$!%*?&#+\-_]+$/;
const passwordMessage = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#+-)';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password is too long'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(100, 'Password is too long')
    .regex(passwordRegex, passwordMessage),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export const newPasswordSchema = z.object({
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(100, 'Password is too long')
    .regex(passwordRegex, passwordMessage),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;