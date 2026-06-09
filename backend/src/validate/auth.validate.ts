import { z } from "zod";

const USERNAME_RULE = z
    .string()
    .min(3, "Too Short!")
    .max(10)
    .regex(/^[a-zA-Z0-9]+$/, { message: "Special characters are not allowed" })

const PASS_RULE = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(50, 'Password cannot exceed 50 characters') 
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');


const SignUpSchema = z.object({
  userName: USERNAME_RULE,
  email: z.email("Invalid Email"),
  password: PASS_RULE
});

const SignInSchema = z.object({
    userName: USERNAME_RULE,
  password: PASS_RULE
});

export const AuthSchema = {
  signUp:SignUpSchema,
  signIn: SignInSchema
}

export namespace Auth {
  export type SignUp = z.infer<typeof SignUpSchema>
  export type SignIn = z.infer<typeof SignInSchema>
}
