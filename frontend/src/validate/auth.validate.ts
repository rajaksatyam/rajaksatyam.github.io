import { z } from 'zod'

const USERNAME_RULE = z
  .string()
  .min(3, 'Too short — min 3 characters')
  .max(10, 'Too long — max 10 characters')
  .regex(/^[a-zA-Z0-9]+$/, 'Only letters and numbers allowed')

const PASS_RULE = z
  .string()
  .min(8, 'At least 8 characters')
// .regex(
//   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$#%^&*()_+!{}":])[A-Za-z\d@$#%^&*()_+!{}":/]+$/,
//   'Needs uppercase, lowercase, number & special character'
// )

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
