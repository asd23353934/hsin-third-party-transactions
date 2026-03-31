import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { PrismaClient } from '@prisma/client'
import { getEnv } from './shared/config/env.config.js'
import { errorHandler } from './shared/errors/error-handler.js'
import { healthRoutes } from './presentation/routes/health.routes.js'
import { transactionRoutes } from './presentation/routes/transaction.routes.js'
import { callbackRoutes } from './presentation/routes/callback.routes.js'
import { resultRoutes } from './presentation/routes/result.routes.js'

const env    = getEnv()
const prisma = new PrismaClient()

const app = Fastify({ logger: true })

// ── Plugins ────────────────────────────────────────────────────────────────
await app.register(cors, {
  origin: env.ALLOWED_ORIGINS.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})
await app.register(sensible)

// 解析 ECPay callback 的 application/x-www-form-urlencoded
app.addContentTypeParser(
  'application/x-www-form-urlencoded',
  { parseAs: 'string' },
  (_req, body, done) => {
    try {
      done(null, Object.fromEntries(new URLSearchParams(body as string)))
    } catch (err) {
      done(err as Error, undefined)
    }
  },
)

// ── Error handler ─────────────────────────────────────────────────────────
app.setErrorHandler(errorHandler)

// ── Routes ─────────────────────────────────────────────────────────────────
await app.register(healthRoutes)
await app.register(transactionRoutes, { prisma })
await app.register(callbackRoutes,    { prisma })
await app.register(resultRoutes)

// ── Start ──────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await prisma.$connect()
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    console.log(`🚀 API listening on port ${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  await app.close()
  await prisma.$disconnect()
  process.exit(0)
})

start()
