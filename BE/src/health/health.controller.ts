import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { PrismaHealthIndicator } from './prisma.health.js'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness: process is up and the database responds' })
  @ApiOkResponse({ description: 'All dependencies are healthy' })
  check() {
    return this.health.check([() => this.prismaHealth.isHealthy('database')])
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness: process is up (does not touch the database)' })
  live() {
    return { status: 'ok' }
  }
}
