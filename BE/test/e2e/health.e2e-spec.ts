import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../../src/app.module.js'

describe('Health (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /api/health/live is up without touching the database', async () => {
    const response = await request(app.getHttpServer()).get('/api/health/live').expect(200)

    expect(response.body).toEqual({ status: 'ok' })
  })

  it('GET /api/health reports the database as up', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200)

    expect(response.body.status).toBe('ok')
    expect(response.body.info.database.status).toBe('up')
  })
})
