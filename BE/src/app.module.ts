import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'
import type { Env } from './config/env.js'
import { validateEnv } from './config/env.js'
import { buildLoggerOptions } from './config/logger.config.js'
import { DocumentsModule } from './documents/documents.module.js'
import { HealthModule } from './health/health.module.js'
import { PrismaModule } from './prisma/prisma.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => buildLoggerOptions(config),
    }),
    PrismaModule,
    HealthModule,
    DocumentsModule,
  ],
})
export class AppModule {}
