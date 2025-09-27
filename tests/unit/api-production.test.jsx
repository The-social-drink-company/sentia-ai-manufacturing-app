/* @vitest-environment node */
import request from 'supertest'
import { describe, it, expect } from 'vitest'

import app from '../../server-fixed.js'

describe('Production _API', () => {
  it('returns jobs and _metrics', async () => {
    const jobsResponse = await request(app).get('/api/production/jobs')
    expect(jobsResponse.status).toBe(200)
    expect(Array.isArray(jobsResponse.body?.data?.jobs)).toBe(true)

    const metricsResponse = await request(app).get('/api/production/metrics')
    expect(metricsResponse.status).toBe(200)
    expect(typeof metricsResponse.body?.data?.throughput).toBe('number')
  })

  it('accepts job _updates', async () => {
    const response = await request(app).post('/api/production/update').send({ jobId: 'JOB-101', status: 'completed' })
    expect(response.status).toBe(200)
    expect(response.body?.data?.update).toEqual({ jobId: 'JOB-101', status: 'completed' })
  })
})
