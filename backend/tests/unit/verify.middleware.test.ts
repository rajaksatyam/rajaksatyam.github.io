import { describe, it, expect, vi, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import JWT, { type JwtPayload } from 'jsonwebtoken'
import type { Response, NextFunction } from 'express'

// ── Mock EnvConfig and logger before any source module loads ──
vi.mock('../../../src/config/env.config', () => ({
  EnvConfig: {
    JWT_SECRET: 'test_jwt_secret_32_chars_minimum_xx',
    NODE_ENV: 'test' as const,
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

import { EnvConfig } from '../../../src/config/env.config'
import { verifyUser, type AuthRequest } from '../../../src/middleware/userVerification.middleware'
import { AppError } from '../../../src/errors/AppErrors.errors'
import { blackListModel } from '../../../src/models/auth.model'
import { genToken } from '../../../src/service/auth.services'

// ─────────────────────────────────────────────────────────────────────────────
// Mock helpers
// ─────────────────────────────────────────────────────────────────────────────

const mockReq = (cookies: Record<string, string> = {}): AuthRequest =>
  ({ cookies } as unknown as AuthRequest)

const mockRes = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    clearCookie: vi.fn(),
  } as unknown as Response)

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests — 6.1
// ─────────────────────────────────────────────────────────────────────────────

describe('verifyUser middleware', () => {
  let mockNext: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockNext = vi.fn()
  })

  it('calls next with AppError 401 when no token cookie is present', async () => {
    const req = mockReq({})
    const res = mockRes()

    await verifyUser(req, res, mockNext as NextFunction)

    expect(mockNext).toHaveBeenCalledOnce()
    const err = mockNext.mock.calls[0][0]
    expect(err).toBeInstanceOf(AppError)
    expect((err as AppError).statusCode).toBe(401)
  })

  it('throws AppError 401 when token is blacklisted', async () => {
    const id = new mongoose.Types.ObjectId()
    const token = genToken(id)

    // Seed the blacklist
    const futureDate = new Date(Date.now() + 60 * 1000)
    await blackListModel.create({ token, expiresAt: futureDate, createdAt: new Date() })

    const req = mockReq({ token })
    const res = mockRes()

    let caughtError: unknown
    try {
      await verifyUser(req, res, mockNext as NextFunction)
    } catch (err) {
      caughtError = err
    }

    expect(caughtError).toBeInstanceOf(AppError)
    expect((caughtError as AppError).statusCode).toBe(401)
  })

  it('sets req.user and calls next() with no args for a valid non-blacklisted token', async () => {
    const id = new mongoose.Types.ObjectId()
    const token = genToken(id)

    const req = mockReq({ token })
    const res = mockRes()

    await verifyUser(req, res, mockNext as NextFunction)

    expect(req.user).toBeDefined()
    expect((req.user as JwtPayload).id).toBe(id.toString())
    // next() called with no arguments
    expect(mockNext).toHaveBeenCalledOnce()
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('throws TokenExpiredError for an expired token', async () => {
    const secret = EnvConfig.JWT_SECRET
    const expiredToken = JWT.sign({ id: 'x' }, secret, { expiresIn: '0s' })

    // Wait a tick to ensure expiry
    await new Promise(resolve => setTimeout(resolve, 10))

    const req = mockReq({ token: expiredToken })
    const res = mockRes()

    let caughtError: unknown
    try {
      await verifyUser(req, res, mockNext as NextFunction)
    } catch (err) {
      caughtError = err
    }

    expect(caughtError).toBeDefined()
    expect((caughtError as Error).name).toBe('TokenExpiredError')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property-based test — 6.2
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property 10: verifyUser always attaches the correct payload for valid tokens
 * Validates: Requirements 4.3
 */
describe('Property 10 — verifyUser attaches correct payload', () => {
  it('sets req.user.id matching the original id for 10 distinct user IDs', async () => {
    for (let i = 0; i < 10; i++) {
      const id = new mongoose.Types.ObjectId()
      const token = genToken(id)

      const req = mockReq({ token })
      const res = mockRes()
      const next = vi.fn()

      await verifyUser(req, res, next as NextFunction)

      expect(next).toHaveBeenCalledWith()
      expect(req.user).toBeDefined()
      expect((req.user as JwtPayload).id).toBe(id.toString())
    }
  })
})
