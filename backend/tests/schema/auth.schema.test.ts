import { describe, it, expect } from 'vitest'
import { AuthSchema } from '../../../src/validate/auth.validate'

// Helper: generate an alphanumeric string of a given length
const genStr = (len: number) => 'a'.repeat(len)

// Helper: check for error on a specific path
const hasErrorOnPath = (result: ReturnType<typeof AuthSchema.signUp.safeParse>, path: string) =>
  result.success === false && result.error!.issues.some(i => i.path[0] === path)

// ─── 11.1  Core unit tests ────────────────────────────────────────────────────

describe('AuthSchema — core unit tests (11.1)', () => {
  // Valid payloads
  it('valid SignUp payload → success: true', () => {
    const result = AuthSchema.signUp.safeParse({
      userName: 'testUser',
      email: 'test@example.com',
      password: 'Abc@1234!',
    })
    expect(result.success).toBe(true)
  })

  it('valid SignIn payload → success: true', () => {
    const result = AuthSchema.signIn.safeParse({
      userName: 'testUser',
      password: 'Abc@1234!',
    })
    expect(result.success).toBe(true)
  })

  // userName validations
  it('userName "ab" (2 chars) → fails on userName path', () => {
    const result = AuthSchema.signUp.safeParse({
      userName: 'ab',
      email: 'test@example.com',
      password: 'Abc@1234!',
    })
    expect(result.success).toBe(false)
    expect(hasErrorOnPath(result, 'userName')).toBe(true)
  })

  it('userName "elevencharss" (12 chars) → fails on userName path', () => {
    const result = AuthSchema.signUp.safeParse({
      userName: 'elevencharss',
      email: 'test@example.com',
      password: 'Abc@1234!',
    })
    expect(result.success).toBe(false)
    expect(hasErrorOnPath(result, 'userName')).toBe(true)
  })

  it('userName "user@name" (special char) → fails on userName path', () => {
    const result = AuthSchema.signUp.safeParse({
      userName: 'user@name',
      email: 'test@example.com',
      password: 'Abc@1234!',
    })
    expect(result.success).toBe(false)
    expect(hasErrorOnPath(result, 'userName')).toBe(true)
  })

  // email validation
  it('email "not-an-email" → fails on email path', () => {
    const result = AuthSchema.signUp.safeParse({
      userName: 'testUser',
      email: 'not-an-email',
      password: 'Abc@1234!',
    })
    expect(result.success).toBe(false)
    expect(hasErrorOnPath(result, 'email')).toBe(true)
  })

  // password validations
  it('password "short" (< 8 chars) → fails on password path', () => {
    const result = AuthSchema.signUp.safeParse({
      userName: 'testUser',
      email: 'test@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
    expect(hasErrorOnPath(result, 'password')).toBe(true)
  })

  it('password "alllowercase1@" (no uppercase) → fails on password path', () => {
    const result = AuthSchema.signUp.safeParse({
      userName: 'testUser',
      email: 'test@example.com',
      password: 'alllowercase1@',
    })
    expect(result.success).toBe(false)
    expect(hasErrorOnPath(result, 'password')).toBe(true)
  })

  it('password "ALLUPPERCASE1@" (no lowercase) → fails on password path', () => {
    const result = AuthSchema.signUp.safeParse({
      userName: 'testUser',
      email: 'test@example.com',
      password: 'ALLUPPERCASE1@',
    })
    expect(result.success).toBe(false)
    expect(hasErrorOnPath(result, 'password')).toBe(true)
  })

  it('password "NoSpecial1234" (no special char) → fails on password path', () => {
    const result = AuthSchema.signUp.safeParse({
      userName: 'testUser',
      email: 'test@example.com',
      password: 'NoSpecial1234',
    })
    expect(result.success).toBe(false)
    expect(hasErrorOnPath(result, 'password')).toBe(true)
  })

  it('password "NoNumber@Abc" (no digit) → fails on password path', () => {
    const result = AuthSchema.signUp.safeParse({
      userName: 'testUser',
      email: 'test@example.com',
      password: 'NoNumber@Abc',
    })
    expect(result.success).toBe(false)
    expect(hasErrorOnPath(result, 'password')).toBe(true)
  })
})

// ─── 11.2  Property test: userName length boundaries (Properties 14 & 15) ────
//
// **Validates: Requirements 7.2, 7.3**

describe('AuthSchema — Property 14 & 15: userName length boundaries (11.2)', () => {
  it('Property 14: lengths [0, 1, 2] all fail on userName path', () => {
    const shortLengths = [0, 1, 2]
    for (const len of shortLengths) {
      const result = AuthSchema.signUp.safeParse({
        userName: genStr(len),
        email: 'test@example.com',
        password: 'Abc@1234!',
      })
      expect(result.success, `expected failure for userName of length ${len}`).toBe(false)
      expect(
        hasErrorOnPath(result, 'userName'),
        `expected error on userName path for length ${len}`
      ).toBe(true)
    }
  })

  it('Property 15: lengths [11, 12, 15, 20] all fail on userName path', () => {
    const longLengths = [11, 12, 15, 20]
    for (const len of longLengths) {
      const result = AuthSchema.signUp.safeParse({
        userName: genStr(len),
        email: 'test@example.com',
        password: 'Abc@1234!',
      })
      expect(result.success, `expected failure for userName of length ${len}`).toBe(false)
      expect(
        hasErrorOnPath(result, 'userName'),
        `expected error on userName path for length ${len}`
      ).toBe(true)
    }
  })
})

// ─── 11.3  Property test: userName special-char rejection (Property 16) ──────
//
// **Validates: Requirements 7.4**

describe('AuthSchema — Property 16: userName special-char rejection (11.3)', () => {
  it('Property 16: userNames containing special chars always fail on userName path', () => {
    const specialChars = [
      '!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '=', '+',
      '[', ']', ';', ':', "'", ',', '.', '<', '>', '?', '/',
    ]

    for (const char of specialChars) {
      // 5-char string: within valid length range, but contains a special char
      const userName = 'abc' + char + 'd'
      const result = AuthSchema.signUp.safeParse({
        userName,
        email: 'test@example.com',
        password: 'Abc@1234!',
      })
      expect(
        result.success,
        `expected failure for userName "${userName}" containing "${char}"`
      ).toBe(false)
      expect(
        hasErrorOnPath(result, 'userName'),
        `expected error on userName path for userName "${userName}" containing "${char}"`
      ).toBe(true)
    }
  })
})

// ─── 11.4  Property test: password length rejection (Property 17) ─────────────
//
// **Validates: Requirements 7.6**

describe('AuthSchema — Property 17: password length rejection (11.4)', () => {
  it('Property 17: lengths [0, 1, 4, 7] all fail on password path', () => {
    const shortLengths = [0, 1, 4, 7]
    for (const len of shortLengths) {
      const result = AuthSchema.signUp.safeParse({
        userName: 'testUser',
        email: 'test@example.com',
        password: genStr(len),
      })
      expect(result.success, `expected failure for password of length ${len}`).toBe(false)
      expect(
        hasErrorOnPath(result, 'password'),
        `expected error on password path for length ${len}`
      ).toBe(true)
    }
  })
})
