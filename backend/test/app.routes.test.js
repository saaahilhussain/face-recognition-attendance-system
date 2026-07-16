import assert from 'node:assert/strict'
import http from 'node:http'
import { after, before, describe, it } from 'node:test'
import mongoose from 'mongoose'
import app from '../src/app.js'

let server
let baseUrl

before(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

  server = http.createServer(app)
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
  await mongoose.disconnect()
})

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options)
}

describe('public backend routes', () => {
  it('returns health status with registered models', async () => {
    const response = await request('/health')
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.service, 'backend')
    assert.equal(body.status, 'ok')
    assert.ok(body.models.includes('Employee'))
    assert.ok(body.database)
  })

  it('returns database schema metadata', async () => {
    const response = await request('/database/schema')
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.status, 'ok')
    assert.ok(body.models.some((model) => model.name === 'Attendance'))
  })

  it('returns 404 for unknown routes', async () => {
    const response = await request('/missing-route')
    const body = await response.json()

    assert.equal(response.status, 404)
    assert.equal(body.status, 'not_found')
  })

  it('validates public employee registration payloads', async () => {
    const response = await request('/public/employees/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(body.status, 'failed')
    assert.ok(body.errors.includes('Employee code is required'))
    assert.ok(body.errors.includes('Full name is required'))
    assert.ok(body.errors.includes('Department is required'))
    assert.ok(body.errors.includes('At least one face image is required'))
  })

  it('validates public attendance payloads', async () => {
    const response = await request('/public/attendance/mark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(body.status, 'failed')
    assert.ok(body.errors.includes('employeeId is required'))
  })
})

describe('protected backend routes', () => {
  const protectedRoutes = [
    '/auth/me',
    '/employees',
    '/attendance',
    '/attendance/summary',
    '/attendance/monthly-report',
    '/attendance/employees/507f1f77bcf86cd799439011/history',
    '/cameras',
    '/dashboard/overview',
    '/realtime/status',
    '/recognition/status',
    '/reports/daily',
    '/reports/monthly',
    '/reports/employees/507f1f77bcf86cd799439011',
  ]

  for (const route of protectedRoutes) {
    it(`rejects unauthenticated request to ${route}`, async () => {
      const response = await request(route)
      const body = await response.json()

      assert.equal(response.status, 401)
      assert.equal(body.status, 'unauthorized')
    })
  }
})

describe('auth validation', () => {
  it('rejects invalid login payload before database lookup', async () => {
    const response = await request('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(body.status, 'failed')
    assert.ok(body.errors.length > 0)
  })
})
