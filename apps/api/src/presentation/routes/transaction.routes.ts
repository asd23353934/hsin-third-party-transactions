import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { apiKeyAuth } from '../middleware/auth.middleware.js'
import { CreateTransactionSchema } from '../../application/use-cases/create-transaction/create-transaction.dto.js'
import { ListTransactionsSchema } from '../../application/use-cases/list-transactions/list-transactions.dto.js'
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction/create-transaction.use-case.js'
import { ListTransactionsUseCase } from '../../application/use-cases/list-transactions/list-transactions.use-case.js'
import { GetTransactionDetailUseCase } from '../../application/use-cases/get-transaction-detail/get-transaction-detail.use-case.js'
import { PrismaTransactionRepository } from '../../infrastructure/database/repositories/transaction.prisma-repository.js'
import { buildGatewayMap } from '../../infrastructure/payment-gateways/gateway.factory.js'
import {
  DuplicateOrderRefError,
  TransactionNotFoundError,
} from '../../domain/transaction/transaction.errors.js'

export async function transactionRoutes(
  app: FastifyInstance,
  options: { prisma: PrismaClient },
): Promise<void> {
  const repo       = new PrismaTransactionRepository(options.prisma)
  const gatewayMap = buildGatewayMap()

  const createUseCase = new CreateTransactionUseCase(repo, gatewayMap)
  const listUseCase   = new ListTransactionsUseCase(repo)
  const detailUseCase = new GetTransactionDetailUseCase(repo)

  // POST /api/transactions
  app.post(
    '/api/transactions',
    { preHandler: [apiKeyAuth] },
    async (request, reply) => {
      const parse = CreateTransactionSchema.safeParse(request.body)
      if (!parse.success) {
        return reply.status(400).send({ statusCode: 400, error: 'VALIDATION_ERROR', message: parse.error.flatten() })
      }

      const result = await createUseCase.execute(parse.data)
      if (!result.ok) {
        if (result.error instanceof DuplicateOrderRefError) {
          return reply.status(409).send({ statusCode: 409, error: 'DUPLICATE_ORDER_REF', message: result.error.message })
        }
        return reply.status(500).send({ statusCode: 500, message: result.error.message })
      }

      return reply.status(201).send({ data: result.value })
    },
  )

  // GET /api/transactions
  app.get(
    '/api/transactions',
    { preHandler: [apiKeyAuth] },
    async (request, reply) => {
      const parse = ListTransactionsSchema.safeParse(request.query)
      if (!parse.success) {
        return reply.status(400).send({ statusCode: 400, error: 'VALIDATION_ERROR', message: parse.error.flatten() })
      }

      const result = await listUseCase.execute(parse.data)
      if (!result.ok) return reply.status(500).send({ statusCode: 500, error: 'INTERNAL_ERROR' })
      return reply.send({ data: result.value })
    },
  )

  // GET /api/transactions/:id
  app.get(
    '/api/transactions/:id',
    { preHandler: [apiKeyAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const result = await detailUseCase.execute(id)

      if (!result.ok) {
        if (result.error instanceof TransactionNotFoundError) {
          return reply.status(404).send({ statusCode: 404, error: 'NOT_FOUND', message: result.error.message })
        }
        return reply.status(500).send({ statusCode: 500, message: 'Internal server error' })
      }

      return reply.send({ data: result.value })
    },
  )
}
