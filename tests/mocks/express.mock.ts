/**
 * Express Request/Response Mock for Unit Tests
 *
 * BMAD-MULTITENANT-002 Story 10: Test Infrastructure
 *
 * Provides mock implementations of Express request and response objects
 * for testing middleware without requiring a live HTTP server.
 *
 * @module tests/mocks/express.mock
 */

import { vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

/**
 * Create a mock Express Request object
 */
export function createMockRequest(overrides?: Partial<Request>): Partial<Request> {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    method: 'GET',
    path: '/',
    url: '/',
    get: vi.fn((header: string) => {
      const headers = (overrides?.headers || {}) as Record<string, string>
      return headers[header.toLowerCase()]
    }),
    ...overrides
  }
}

/**
 * Create a mock Express Response object
 */
export function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    locals: {}
  }

  return res
}

/**
 * Create a mock Express NextFunction
 */
export function createMockNext(): NextFunction {
  return vi.fn()
}

/**
 * Create a complete mock Express context (req, res, next)
 */
export function createMockExpressContext(requestOverrides?: Partial<Request>) {
  return {
    req: createMockRequest(requestOverrides),
    res: createMockResponse(),
    next: createMockNext()
  }
}

/**
 * Helper to extract status code from mock response
 */
export function getResponseStatus(res: Partial<Response>): number {
  const statusMock = res.status as any
  return statusMock.mock?.calls[0]?.[0] || 200
}

/**
 * Helper to extract JSON body from mock response
 */
export function getResponseJson(res: Partial<Response>): any {
  const jsonMock = res.json as any
  return jsonMock.mock?.calls[0]?.[0]
}

/**
 * Helper to check if next() was called
 */
export function wasNextCalled(next: NextFunction): boolean {
  return (next as any).mock?.calls?.length > 0
}

/**
 * Helper to check if next() was called with an error
 */
export function wasNextCalledWithError(next: NextFunction): boolean {
  const calls = (next as any).mock?.calls || []
  return calls.some((call: any[]) => call[0] instanceof Error)
}
