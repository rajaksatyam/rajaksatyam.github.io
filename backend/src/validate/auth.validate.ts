import { z } from "zod";

const USERNAME_RULE = z
    .string()
    .min(3, "Too Short!")
    .max(10)
    .regex(/^[a-zA-Z0-9]+$/, { message: "Special characters are not allowed" })

const PASS_RULE = z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$#%^&*()_+!{}:"])[A-Za-z\d@$#%^&*()_+!{}:."]+$/,
      {
        message:
          "Must contain at least one uppercase, one lowercase, one number, and one special character",
      },
    )


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
