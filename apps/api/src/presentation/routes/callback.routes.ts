import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { HandlePaymentCallbackUseCase } from '../../application/use-cases/handle-payment-callback/handle-payment-callback.use-case.js'
import { PrismaTransactionRepository } from '../../infrastructure/database/repositories/transaction.prisma-repository.js'
import { DiscordNotificationService } from '../../infrastructure/discord/discord-notification.service.js'
import { buildGatewayMap } from '../../infrastructure/payment-gateways/gateway.factory.js'

export async function callbackRoutes(
  app: FastifyInstance,
  options: { prisma: PrismaClient },
): Promise<void> {
  const repo            = new PrismaTransactionRepository(options.prisma)
  const notificationSvc = new DiscordNotificationService()
  const gatewayMap      = buildGatewayMap()

  const handleCallbackUseCase = new HandlePaymentCallbackUseCase(repo, notificationSvc, gatewayMap)

  /**
   * POST /api/callback/:gateway
   * Receives payment callbacks from ECPay / NewebPay.
   * MUST respond 200 immediately (gateways retry on non-200).
   */
  app.post<{ Params: { gateway: string }; Body: Record<string, unknown> }>(
    '/api/callback/:gateway',
    async (request, reply) => {
      // Always respond 200 first to prevent gateway retry
      reply.status(200).send('1|OK')

      // Process async (after response has been sent)
      const { gateway } = request.params
      const rawPayload  = request.body ?? {}

      // Save raw callback for audit trail
      try {
        await options.prisma.paymentCallback.create({
          data: {
            transaction_id: String(rawPayload['CustomField1'] ?? rawPayload['OrderComment'] ?? 'unknown'),
            raw_payload:    rawPayload as object,
            gateway,
          },
        })
      } catch {
        // Non-critical: don't fail the whole callback
      }

      const result = await handleCallbackUseCase.execute({ gateway, rawPayload })
      if (!result.ok) {
        app.log.error({ err: result.error }, '[Callback] Processing error')
      }
    },
  )
}
