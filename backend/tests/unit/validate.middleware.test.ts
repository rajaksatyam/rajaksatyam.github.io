import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

// ── Mock EnvConfig and logger to prevent import side effects ──
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

import { validate } from '../../../src/middleware/validate.middleware'
import { AuthSchema } from '../../../src/validate/auth.validate'

// ── Mock helpers ──
const makeReq = (body: unknown) => ({ body } as Request)

const makeRes = () => {
  const res = { status: vi.fn(), json: vi.fn() } as any
  res.status.mockReturnValue(res)
  return res
}

const makeNext = () => vi.fn() as unknown as NextFunction

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests — 6.3
// ─────────────────────────────────────────────────────────────────────────────

describe('validate middleware — core unit tests', () => {
  const handler = validate(AuthSchema.signUp)

  it('calls next() with no args and sets req.body to parsed object for a valid body', async () => {
    const body = { userName: 'testAbc', email: 'test@example.com', password: 'Abc@1234' }
    const req = makeReq(body)
    const res = makeRes()
    const next = makeNext()

    await handler(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith()          // called with no arguments
    expect(req.body).toMatchObject({
      userName: 'testAbc',
      email: 'test@example.com',
      password: 'Abc@1234',
    })
    expect(res.status).not.toHaveBeenCalled()
  })

  it('responds with status 400 and errors array for an invalid body (missing fields)', async () => {
    const req = makeReq({})
    const res = makeRes()
    const next = makeNext()

    await handler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledOnce()

    const jsonArg = res.json.mock.calls[0][0] as { errors: Array<{ field: string; message: string }> }
    expect(Array.isArray(jsonArg.errors)).toBe(true)
    expect(jsonArg.errors.length).toBeGreaterThan(0)

    for (const err of jsonArg.errors) {
      expect(typeof err.field).toBe('string')
      expect(typeof err.message).toBe('string')
    }

    expect(next).not.toHaveBeenCalled()
  })

  it('strips extra unknown fields per Zod strip defaults', async () => {
    const body = {
      userName: 'testAbc',
      email: 'test@example.com',
      password: 'Abc@1234',
      extraField: 'should be stripped',
      anotherExtra: 42,
    }
    const req = makeReq(body)
    const res = makeRes()
    const next = makeNext()

    await handler(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith()
    expect(req.body).not.toHaveProperty('extraField')
    expect(req.body).not.toHaveProperty('anotherExtra')
    expect(req.body).toMatchObject({
      userName: 'testAbc',
      email: 'test@example.com',
      password: 'Abc@1234',
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property-based tests
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property 11: ValidateMiddleware always passes through valid bodies unchanged
 * Validates: Requirements 4.5
 */
describe('Property 11 — validate passes valid bodies', () => {
  it('calls next with no error and sets req.body for 10 distinct valid SignUp payloads', async () => {
    const validPayloads = [
      { userName: 'alice1', email: 'alice1@example.com', password: 'Alice@1234' },
      { userName: 'bob22', email: 'bob22@example.com', password: 'Bob@22345' },
      { userName: 'carol3', email: 'carol3@example.com', password: 'Carol@3456' },
      { userName: 'dave44', email: 'dave44@example.com', password: 'Dave@44567' },
      { userName: 'eve5', email: 'eve5@example.com', password: 'Eve@56789' },
      { userName: 'frank6', email: 'frank6@example.com', password: 'Frank@6789' },
      { userName: 'grace7', email: 'grace7@example.com', password: 'Grace@7890' },
      { userName: 'henry8', email: 'henry8@example.com', password: 'Henry@8901' },
      { userName: 'iris9', email: 'iris9@example.com', password: 'Iris@91234' },
      { userName: 'jack10', email: 'jack10@example.com', password: 'Jack@10234' },
    ]

    const handler = validate(AuthSchema.signUp)

    for (const payload of validPayloads) {
      const req = makeReq({ ...payload })
      const res = makeRes()
      const next = makeNext()

      await handler(req, res, next)

      expect(next).toHaveBeenCalledOnce()
      expect(next).toHaveBeenCalledWith()      // no error argument
      expect(req.body).toMatchObject(payload)
      expect(res.status).not.toHaveBeenCalled()
    }
  })
})

/**
 * Property 12: ValidateMiddleware always rejects invalid bodies with a 400 and structured errors
 * Validates: Requirements 4.6
 */
describe('Property 12 — validate rejects invalid bodies with structured errors', () => {
  it('responds with 400 and errors array (field + message) for 10 distinct invalid payloads', async () => {
    const invalidPayloads: unknown[] = [
      {},                                                                          // completely empty
      { email: 'test@example.com', password: 'Abc@1234' },                       // missing userName
      { userName: 'testAbc', email: 'test@example.com' },                        // missing password
      { userName: 'testAbc', password: 'Abc@1234' },                             // missing email
      { userName: 'ab', email: 'test@example.com', password: 'Abc@1234' },      // userName too short
      { userName: 'toolonguser12', email: 'test@example.com', password: 'Abc@1234' }, // userName too long
      { userName: 'testAbc', email: 'not-an-email', password: 'Abc@1234' },     // invalid email
      { userName: 'testAbc', email: 'test@example.com', password: 'short' },    // password too short
      { userName: 'testAbc', email: 'test@example.com', password: 'alllower1@' }, // no uppercase
      { userName: 'user@name', email: 'test@example.com', password: 'Abc@1234' }, // special char in userName
    ]

    const handler = validate(AuthSchema.signUp)

    for (const payload of invalidPayloads) {
      const req = makeReq(payload)
      const res = makeRes()
      const next = makeNext()

      await handler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledOnce()

      const jsonArg = res.json.mock.calls[0][0] as { errors: Array<{ field: string; message: string }> }
      expect(Array.isArray(jsonArg.errors)).toBe(true)
      expect(jsonArg.errors.length).toBeGreaterThan(0)

      for (const err of jsonArg.errors) {
        expect(typeof err.field).toBe('string')
        expect(typeof err.message).toBe('string')
      }

      expect(next).not.toHaveBeenCalled()
    }
  })
})
