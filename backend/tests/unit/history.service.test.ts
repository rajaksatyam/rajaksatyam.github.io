import { describe, it, expect, vi } from 'vitest'
import mongoose from 'mongoose'

// ── Provide EnvConfig and logger before any source module loads ──
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

import type { Analysis } from '../../../src/service/summery.LLM.service'
import {
  saveHistoryService,
  getHistoryService,
  deleteHistoryItemService,
  clearHistoryService,
} from '../../../src/service/history.service'
import { historyModel } from '../../../src/models/history.model'

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeUserId(): string {
  return new mongoose.Types.ObjectId().toString()
}

function makeAnalysis(): Analysis {
  return {
    title: 'Test',
    summary: { overview: 'o', keyPoints: ['k'] },
    transcription: [{ timestamp: '00:00', text: 't' }],
    verification: { factCheckReport: 'f', verdict: 'accurate' },
    resources: [],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests — 4.1
// ─────────────────────────────────────────────────────────────────────────────

describe('saveHistoryService', () => {
  it('returns doc with userId, url, and result matching inputs', async () => {
    const userId = makeUserId()
    const url = 'https://example.com/video'
    const result = makeAnalysis()

    const doc = await saveHistoryService(userId, url, result)

    expect(doc.userId.toString()).toBe(userId)
    expect(doc.url).toBe(url)
    expect(doc.result).toMatchObject(result)
  })
})

describe('getHistoryService', () => {
  it('returns empty state when no items exist', async () => {
    const userId = makeUserId()
    const res = await getHistoryService(userId, 1)
    expect(res.items).toEqual([])
    expect(res.total).toBe(0)
    expect(res.hasMore).toBe(false)
  })

  it('page 1 of 15 items: total=15, hasMore=true, items.length=10', async () => {
    const userId = makeUserId()
    for (let i = 0; i < 15; i++) {
      await historyModel.create({
        userId,
        url: `https://example.com/${i}`,
        result: makeAnalysis(),
        createdAt: new Date(Date.now() - i * 1000),
      })
    }

    const res = await getHistoryService(userId, 1)
    expect(res.total).toBe(15)
    expect(res.hasMore).toBe(true)
    expect(res.items.length).toBe(10)
  })

  it('page 2 of 15 items: hasMore=false, items.length=5', async () => {
    const userId = makeUserId()
    for (let i = 0; i < 15; i++) {
      await historyModel.create({
        userId,
        url: `https://example.com/${i}`,
        result: makeAnalysis(),
        createdAt: new Date(Date.now() - i * 1000),
      })
    }

    const res = await getHistoryService(userId, 2)
    expect(res.hasMore).toBe(false)
    expect(res.items.length).toBe(5)
  })

  it('page 1 items are sorted newest-first', async () => {
    const userId = makeUserId()
    for (let i = 0; i < 15; i++) {
      await historyModel.create({
        userId,
        url: `https://example.com/${i}`,
        result: makeAnalysis(),
        createdAt: new Date(Date.now() - i * 1000),
      })
    }

    const res = await getHistoryService(userId, 1)
    const items = res.items
    for (let i = 0; i < items.length - 1; i++) {
      const curr = new Date(items[i]!.createdAt).getTime()
      const next = new Date(items[i + 1]!.createdAt).getTime()
      expect(curr).toBeGreaterThanOrEqual(next)
    }
  })
})

describe('deleteHistoryItemService', () => {
  it('returns non-null doc and subsequent getHistoryService excludes it', async () => {
    const userId = makeUserId()
    const saved = await saveHistoryService(userId, 'https://example.com/del', makeAnalysis())
    const id = saved._id.toString()

    const deleted = await deleteHistoryItemService(userId, id)
    expect(deleted).not.toBeNull()
    expect(deleted!._id.toString()).toBe(id)

    const after = await getHistoryService(userId, 1)
    const ids = after.items.map((item) => item._id.toString())
    expect(ids).not.toContain(id)
  })

  it('returns null when userId does not match', async () => {
    const ownerUserId = makeUserId()
    const otherUserId = makeUserId()
    const saved = await saveHistoryService(ownerUserId, 'https://example.com/owner', makeAnalysis())
    const id = saved._id.toString()

    const result = await deleteHistoryItemService(otherUserId, id)
    expect(result).toBeNull()
  })
})

describe('clearHistoryService', () => {
  it('clears all items for userA, leaves userB items unchanged', async () => {
    const userA = makeUserId()
    const userB = makeUserId()

    for (let i = 0; i < 3; i++) {
      await saveHistoryService(userA, `https://example.com/a${i}`, makeAnalysis())
    }
    for (let i = 0; i < 4; i++) {
      await saveHistoryService(userB, `https://example.com/b${i}`, makeAnalysis())
    }

    await clearHistoryService(userA)

    const afterA = await getHistoryService(userA, 1)
    expect(afterA.total).toBe(0)

    const afterB = await getHistoryService(userB, 1)
    expect(afterB.total).toBe(4)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property-based tests
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property 6: saveHistoryService round-trip — saved document matches input
 * Validates: Requirements 3.1
 */
describe('Property 6 — saveHistoryService round-trip', () => {
  it('saved document matches inputs for 20 combinations', async () => {
    for (let i = 0; i < 20; i++) {
      const userId = makeUserId()
      const url = `https://example.com/prop6/${i}`
      const analysis = makeAnalysis()

      const doc = await saveHistoryService(userId, url, analysis)

      expect(doc.userId.toString()).toBe(userId)
      expect(doc.url).toBe(url)
      expect(doc.result).toMatchObject(analysis)
    }
  })
})

/**
 * Property 7: getHistoryService always returns items sorted newest-first
 * Validates: Requirements 3.3
 */
describe('Property 7 — getHistoryService sorted order', () => {
  it('items are sorted newest-first for seed counts of 5, 10, and 12', async () => {
    const counts = [5, 10, 12]

    for (const count of counts) {
      const userId = makeUserId()
      for (let i = 0; i < count; i++) {
        await historyModel.create({
          userId,
          url: `https://example.com/prop7/${i}`,
          result: makeAnalysis(),
          createdAt: new Date(Date.now() - i * 1000),
        })
      }

      const res = await getHistoryService(userId, 1)
      const items = res.items
      for (let i = 0; i < items.length - 1; i++) {
        const curr = new Date(items[i]!.createdAt).getTime()
        const next = new Date(items[i + 1]!.createdAt).getTime()
        expect(curr).toBeGreaterThanOrEqual(next)
      }
    }
  })
})

/**
 * Property 8: clearHistoryService deletes only the target user's records
 * Validates: Requirements 3.7
 */
describe('Property 8 — clearHistoryService isolates by user', () => {
  it('clearing userA does not affect userB total for 3 pairs of distinct users', async () => {
    // Seed counts per pair: [3, 4], [5, 6], [7, 3]
    const pairs: Array<[number, number]> = [
      [3, 4],
      [5, 6],
      [7, 3],
    ]

    for (const [countA, countB] of pairs) {
      const userA = makeUserId()
      const userB = makeUserId()

      for (let i = 0; i < countA; i++) {
        await saveHistoryService(userA, `https://example.com/a${i}`, makeAnalysis())
      }
      for (let i = 0; i < countB; i++) {
        await saveHistoryService(userB, `https://example.com/b${i}`, makeAnalysis())
      }

      const beforeB = await getHistoryService(userB, 1)
      await clearHistoryService(userA)
      const afterB = await getHistoryService(userB, 1)

      expect(afterB.total).toBe(beforeB.total)
    }
  })
})

/**
 * Property 9: deleteHistoryItemService always returns the deleted document when IDs match
 * Validates: Requirements 3.5
 */
describe('Property 9 — deleteHistoryItemService removes the item', () => {
  it('returns non-null and item is gone from DB for 10 saved items', async () => {
    for (let i = 0; i < 10; i++) {
      const userId = makeUserId()
      const doc = await saveHistoryService(userId, `https://example.com/prop9/${i}`, makeAnalysis())
      const id = doc._id.toString()

      const deleted = await deleteHistoryItemService(userId, id)
      expect(deleted).not.toBeNull()

      const found = await historyModel.findById(id)
      expect(found).toBeNull()
    }
  })
})
