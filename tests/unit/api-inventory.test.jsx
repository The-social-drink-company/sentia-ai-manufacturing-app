/* @vitest-environment node */
import request from 'supertest'
import { describe, it, expect } from 'vitest'

import app from '../../server-fixed.js'

describe('Inventory API', () => {
  it('returns inventory levels', async () => {
    const response = await request(app).get('/api/inventory/levels')
    expect(response.status).toBe(200)
    expect(Array.isArray(response.body?.data?.levels)).toBe(true)
  })

  it('queues optimisation requests', async () => {
    const payload = { objectives: ['rebalance'] }
    const response = await request(app).post('/api/inventory/optimize').send(payload)
    expect(response.status).toBe(200)
    expect(response.body?.data?.objectives).toEqual(payload.objectives)
  })
})
