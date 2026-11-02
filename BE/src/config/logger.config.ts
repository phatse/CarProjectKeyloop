import { randomUUID } from 'node:crypto'
import type { ConfigService } from '@nestjs/config'
import type { Params } from 'nestjs-pino'
import type { Env } from './env.js'

export function buildLoggerOptions(config: ConfigService<Env, true>): Params {
  const isProduction = config.get('NODE_ENV', { infer: true }) === 'production'

  return {
    pinoHttp: {
      level: config.get('LOG_LEVEL', { infer: true }),
      genReqId: (req, res) => {
        const incoming = req.headers['x-correlation-id']
        const correlationId =
          typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID()

        res.setHeader('x-correlation-id', correlationId)
        return correlationId
      },
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie'],
        censor: '[redacted]',
      },
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              translateTime: 'SYS:HH:MM:ss.l',
            },
          },
    },
  }
}
