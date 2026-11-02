import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module.js'
import type { Env } from './config/env.js'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  app.useLogger(app.get(Logger))

  // Required so SIGTERM triggers PrismaService.onModuleDestroy (clean pool shutdown).
  app.enableShutdownHooks()

  app.setGlobalPrefix('api')

  const config = app.get(ConfigService<Env, true>)

  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CarProject API')
    .setDescription('Keyloop technical assessment — Scenario D (Unified Document Viewer)')
    .setVersion('0.1.0')
    .addServer('/api')
    .build()

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))

  await app.listen(config.get('PORT', { infer: true }))
}

await bootstrap()
