import type { FastifyReply, FastifyRequest } from 'fastify'
import { getEnv } from '../../shared/config/env.config.js'

export async function apiKeyAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const key = request.headers['x-api-key']
  if (!key || key !== getEnv().API_SECRET_KEY) {
    reply.status(401).send({ statusCode: 401, error: 'UNAUTHORIZED', message: 'Invalid API key' })
  }
}
