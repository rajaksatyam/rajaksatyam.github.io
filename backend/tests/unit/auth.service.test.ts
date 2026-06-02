import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import mongoose from 'mongoose'
import JWT, { type JwtPayload } from 'jsonwebtoken'

// ── Provide EnvConfig before any source module loads to break circular dep ──
// env.config.ts imports logger.utility.ts which reads EnvConfig at module init.
// We mock both env.config and logger.utility so the circular dep never fires.
vi.mock('../../../src/config/env.config', () => ({
  EnvConfig: {
    PORT: 3001,
    MONGO_URI: 'mongodb://127.0.0.1:27017/test',
    JWT_SECRET: 'test_jwt_secret_32_chars_minimum_xx',
    NODE_ENV: 'test' as const,
    CLIENT_URI: 'http://localhost:5173',
    ARGON2_PEPPER: 'test_pepper_64_chars_minimum_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    GEMINI_KEY: 'test_gemini_key',
  },
}))

vi.mock('../../../src/utility/logger.utility', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock hashing utility to avoid argon2 cost
vi.mock('../../../src/utility/hashing.utility')

import { EnvConfig } from '../../../src/config/env.config'
import { genToken, RegisterUser, signInUser, tokenBlackListService } from '../../../src/service/auth.services'
import { AppError } from '../../../src/errors/AppErrors.errors'
import { blackListModel } from '../../../src/models/auth.model'
import * as hashingModule from '../../../src/utility/hashing.utility'

// Set up default mock implementations for hashing functions
beforeAll(() => {
  vi.spyOn(hashingModule, 'hashPassword').mockResolvedValue('hashed_password')
  vi.spyOn(hashingModule, 'verifyPassword').mockResolvedValue(true)
})

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests — 2.1
// ─────────────────────────────────────────────────────────────────────────────

describe('genToken', () => {
  it('returns a valid JWT encoding the given ObjectId', () => {
    const id = new mongoose.Types.ObjectId()
    const token = genToken(id)
    const payload = JWT.verify(token, EnvConfig.JWT_SECRET) as JwtPayload
    expect(payload.id).toBe(id.toString())
  })
})

describe('RegisterUser', () => {
  it('returns { userName, email, token } for valid unique data', async () => {
    const result = await RegisterUser({
      userName: 'alice1',
      email: 'alice@example.com',
      password: 'Abc@1234',
    })
    expect(result).toMatchObject({ userName: 'alice1', email: 'alice@example.com' })
    expect(typeof (result as { token: string }).token).toBe('string')
    expect((result as { token: string }).token.length).toBeGreaterThan(0)
  })

  it('returns "user Already Exists." for a duplicate userName', async () => {
    // Seed first user
    await RegisterUser({
      userName: 'dupuser',
      email: 'dup1@example.com',
      password: 'Abc@1234',
    })
    // Attempt duplicate userName
    const result = await RegisterUser({
      userName: 'dupuser',
      email: 'dup2@example.com',
      password: 'Abc@1234',
    })
    expect(result).toBe('user Already Exists.')
  })
})

describe('signInUser', () => {
  beforeEach(async () => {
    // Create a user to sign in with
    await RegisterUser({
      userName: 'signuser',
      email: 'signin@example.com',
      password: 'Abc@1234',
    })
    // Reset verifyPassword mock to return true before each test
    vi.spyOn(hashingModule, 'verifyPassword').mockResolvedValue(true)
  })

  it('returns { userName, email, token } for valid credentials', async () => {
    const result = await signInUser({ userName: 'signuser', password: 'Abc@1234' })
    expect(result).toMatchObject({ userName: 'signuser', email: 'signin@example.com' })
    expect(typeof result.token).toBe('string')
    expect(result.token.length).toBeGreaterThan(0)
  })

  it('throws AppError 401 for unknown userName', async () => {
    await expect(
      signInUser({ userName: 'nobody', password: 'Abc@1234' }),
    ).rejects.toThrow(AppError)

    await expect(
      signInUser({ userName: 'nobody', password: 'Abc@1234' }),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws AppError 401 when verifyPassword returns false', async () => {
    vi.spyOn(hashingModule, 'verifyPassword').mockResolvedValue(false)

    await expect(
      signInUser({ userName: 'signuser', password: 'WrongPass@1' }),
    ).rejects.toThrow(AppError)

    vi.spyOn(hashingModule, 'verifyPassword').mockResolvedValue(false)
    await expect(
      signInUser({ userName: 'signuser', password: 'WrongPass@1' }),
    ).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('tokenBlackListService', () => {
  it('persists a valid JWT in the blacklist with correct expiresAt/createdAt', async () => {
    const id = new mongoose.Types.ObjectId()
    const token = genToken(id)

    await tokenBlackListService(token)

    const doc = await blackListModel.findOne({ token })
    expect(doc).not.toBeNull()

    const decoded = JWT.decode(token) as JwtPayload
    expect(doc!.expiresAt.getTime()).toBe(decoded.exp! * 1000)
    expect(doc!.createdAt.getTime()).toBe(decoded.iat! * 1000)
  })

  it('throws AppError 401 for "not.a.token"', async () => {
    await expect(tokenBlackListService('not.a.token')).rejects.toThrow(AppError)
    await expect(tokenBlackListService('not.a.token')).rejects.toMatchObject({
      statusCode: 401,
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property-based tests
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property 2: genToken round-trip — token always encodes the given ID
 * Validates: Requirements 2.6
 */
describe('Property 2 — genToken round-trip', () => {
  it('encodes every ObjectId correctly across 50 random IDs', () => {
    for (let i = 0; i < 50; i++) {
      const id = new mongoose.Types.ObjectId()
      const token = genToken(id)
      const payload = JWT.verify(token, EnvConfig.JWT_SECRET) as JwtPayload
      expect(payload.id).toBe(id.toString())
    }
  })
})

/**
 * Property 1: RegisterUser always returns a complete user profile for valid new data
 * Validates: Requirements 2.1
 */
describe('Property 1 — RegisterUser always returns complete profile', () => {
  it('returns userName, email, and non-empty token for all valid distinct inputs', async () => {
    const payloads = [
      { userName: 'abc', email: 'abc@test.com', password: 'Abc@1234' },
      { userName: 'xyz123', email: 'xyz@test.com', password: 'Xyz@5678' },
      { userName: 'user01', email: 'user01@test.com', password: 'User@0001' },
      { userName: 'hello', email: 'hello@test.com', password: 'Hello@123' },
      { userName: 'test99', email: 'test99@test.com', password: 'Test@9999' },
    ]

    for (const payload of payloads) {
      const result = await RegisterUser(payload)
      expect(result).toMatchObject({ userName: payload.userName, email: payload.email })
      expect(typeof (result as { token: string }).token).toBe('string')
      expect((result as { token: string }).token.length).toBeGreaterThan(0)
    }
  })
})

/**
 * Property 5: signInUser always rejects unknown userNames with a 401 AppError
 * Validates: Requirements 2.4
 */
describe('Property 5 — signInUser rejects unknown userNames', () => {
  it('throws AppError 401 for 10 random alphanumeric userNames not in DB', async () => {
    // Generate 10 random 8-char alphanumeric strings
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const randomName = () =>
      Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

    for (let i = 0; i < 10; i++) {
      const userName = `r${randomName().slice(1)}` // ensure starts with letter, length=8
      let thrownError: unknown
      try {
        await signInUser({ userName, password: 'Abc@1234' })
      } catch (err) {
        thrownError = err
      }
      expect(thrownError).toBeInstanceOf(AppError)
      expect((thrownError as AppError).statusCode).toBe(401)
    }
  })
})

/**
 * Property 3: tokenBlackListService always persists the token
 * Validates: Requirements 2.7
 */
describe('Property 3 — tokenBlackListService always persists', () => {
  it('persists 5 fresh JWTs with correct expiresAt and createdAt', async () => {
    for (let i = 0; i < 5; i++) {
      const id = new mongoose.Types.ObjectId()
      const token = genToken(id)

      await tokenBlackListService(token)

      const doc = await blackListModel.findOne({ token })
      expect(doc).not.toBeNull()

      const decoded = JWT.decode(token) as JwtPayload
      expect(doc!.expiresAt.getTime()).toBe(decoded.exp! * 1000)
      expect(doc!.createdAt.getTime()).toBe(decoded.iat! * 1000)
    }
  })
})
