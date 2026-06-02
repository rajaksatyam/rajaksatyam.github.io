import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

// ── Mock EnvConfig before any source module loads ──────────────────────────
vi.mock('../../../src/config/env.config', () => ({
  EnvConfig: { NODE_ENV: 'test' },
}))

vi.mock('../../../src/utility/logger.utility', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

import { globalErrors, notFoundError } from '../../../src/middleware/errorHandle.middleware'
import { AppError } from '../../../src/errors/AppErrors.errors'

// ── Shared mock factories ───────────────────────────────────────────────────

const makeReq = (): Request =>
  ({ path: '/test', method: 'GET', originalUrl: '/test' }) as Request

const makeRes = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }) as unknown as Response

// ─────────────────────────────────────────────────────────────────────────────
// 6.6 — Core unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe('globalErrors middleware', () => {
  let req: Request
  let res: Response
  let next: NextFunction

  beforeEach(() => {
    vi.clearAllMocks()
    req = makeReq()
    res = makeRes()
    next = vi.fn()
  })

  it('handles AppError(403, "Forbidden") — status 403 and correct JSON', () => {
    const err = new AppError('Forbidden', 403)
    globalErrors(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Forbidden' })
  })

  it('handles MongoDB 11000 duplicate-key error — status 409 with field name in message', () => {
    const err = { code: 11000, keyValue: { email: 'x@y.com' } }
    globalErrors(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(409)
    const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      success: boolean
      message: string
    }
    expect(jsonArg.message).toContain('email')
  })

  it('handles Mongoose CastError — status 400 with path in message', () => {
    const err = { name: 'CastError', path: '_id' }
    globalErrors(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      success: boolean
      message: string
    }
    expect(jsonArg.message).toContain('_id')
  })

  it('handles JsonWebTokenError — status 401, message "Invalid token."', () => {
    const err = { name: 'JsonWebTokenError' }
    globalErrors(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid token.' })
  })

  it('handles TokenExpiredError — status 401, message "Token expired."', () => {
    const err = { name: 'TokenExpiredError' }
    globalErrors(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Token expired.' })
  })

  it('handles plain Error("boom") — status 500, message "Internal Server Error"', () => {
    const err = new Error('boom')
    globalErrors(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' })
  })
})

describe('notFoundError middleware', () => {
  let req: Request
  let res: Response
  let next: NextFunction

  beforeEach(() => {
    vi.clearAllMocks()
    req = makeReq()
    res = makeRes()
    next = vi.fn()
  })

  it('calls next with an AppError of statusCode 404', () => {
    notFoundError(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    const passedErr = (next as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(passedErr).toBeInstanceOf(AppError)
    expect(passedErr.statusCode).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6.7 — Property test: GlobalErrors mirrors AppError (Property 13)
// Validates: Requirements 4.7
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property 13: GlobalErrors always mirrors AppError statusCode and message
 *
 * For status codes [400, 401, 403, 404, 409, 422, 500] each with a unique
 * message string, construct an AppError and pass to globalErrors; assert
 * res.status is called with that exact code and res.json is called with
 * an object where message equals the AppError message.
 *
 * **Validates: Requirements 4.7**
 */
describe('Property 13 — GlobalErrors mirrors AppError statusCode and message', () => {
  it('preserves statusCode and message for all standard error codes', () => {
    const cases: Array<{ code: number; message: string }> = [
      { code: 400, message: 'Bad request input provided' },
      { code: 401, message: 'Authentication required here' },
      { code: 403, message: 'Access denied to resource' },
      { code: 404, message: 'Requested resource not found' },
      { code: 409, message: 'Conflict with existing record' },
      { code: 422, message: 'Unprocessable entity submitted' },
      { code: 500, message: 'Unexpected internal failure occurred' },
    ]

    for (const { code, message } of cases) {
      vi.clearAllMocks()
      const req = makeReq()
      const res = makeRes()
      const next = vi.fn()

      const err = new AppError(message, code)
      globalErrors(err, req, res, next)

      expect(res.status).toHaveBeenCalledWith(code)

      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
        success: boolean
        message: string
      }
      expect(jsonArg.message).toBe(message)
    }
  })
})
