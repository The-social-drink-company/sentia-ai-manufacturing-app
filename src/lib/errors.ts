export class ApplicationError extends Error {
  code: string | null
  statusCode: number
  metadata: Record<string, unknown>
  timestamp: string
  correlationId: string | null
  cause?: Error

  constructor(message: string, options: {
    code?: string
    statusCode?: number
    metadata?: Record<string, unknown>
    correlationId?: string
    cause?: Error
  } = {}) {
    super(message)

    this.name = new.target.name
    this.code = options.code ?? null
    this.statusCode = options.statusCode ?? 500
    this.metadata = options.metadata ?? {}
    this.timestamp = new Date().toISOString()
    this.correlationId = options.correlationId ?? null

    if (options.cause) {
      this.cause = options.cause
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      ...(this.cause && {
        cause: {
          name: this.cause.name,
          message: this.cause.message,
          stack: this.cause.stack
        }
      })
    }
  }
}

