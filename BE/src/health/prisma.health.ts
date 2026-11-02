import { Injectable } from '@nestjs/common'
import { HealthIndicatorService } from '@nestjs/terminus'
import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  isHealthy(key = 'database') {
    return this.healthIndicatorService
      .check(key)
      .attempt(async () => {
        await this.prisma.$queryRaw`SELECT 1`
        return { reachable: true }
      })
      .withTimeout(2000)
  }
}
