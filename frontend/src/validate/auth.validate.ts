import { z } from 'zod'

const USERNAME_RULE = z
  .string()
  .min(3, 'Too short — min 3 characters')
  .max(10, 'Too long — max 10 characters')
  .regex(/^[a-zA-Z0-9]+$/, 'Only letters and numbers allowed')

const PASS_RULE = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(50, 'Password cannot exceed 50 characters') 
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const SignUpSchema = z.object({
  userName: USERNAME_RULE,
  email: z.string().email('Invalid email'),
  password: PASS_RULE,
})

export const SignInSchema = z.object({
  userName: USERNAME_RULE,
  password: PASS_RULE,
})

export const UrlSchema = z.object({
  url: z
    .string()
    .url('Enter a valid URL')
    .refine(
      (v) =>
        v.includes('youtube.com') ||
        v.includes('youtu.be') ||
        v.includes('instagram.com') ||
        v.startsWith('http'),
      'Paste a YouTube, Instagram or blog URL'
    ),
})

export type SignUpInput = z.infer<typeof SignUpSchema>
export type SignInInput = z.infer<typeof SignInSchema>
export type UrlInput = z.infer<typeof UrlSchema>
