import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import {
  TransactionNotFoundError,
  DuplicateOrderRefError,
  InvalidSignatureError,
  InvalidTransactionStateError,
} from '../../domain/transaction/transaction.errors.js'

export function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof TransactionNotFoundError) {
    reply.status(404).send({ statusCode: 404, error: error.code, message: error.message })
    return
  }

  if (error instanceof DuplicateOrderRefError) {
    reply.status(409).send({ statusCode: 409, error: error.code, message: error.message })
    return
  }

  if (error instanceof InvalidSignatureError) {
    reply.status(400).send({ statusCode: 400, error: error.code, message: error.message })
    return
  }

  if (error instanceof InvalidTransactionStateError) {
    reply.status(422).send({ statusCode: 422, error: error.code, message: error.message })
    return
  }

  // Zod / Fastify validation errors
  if ('statusCode' in error && error.statusCode && error.statusCode < 500) {
    reply.status(error.statusCode).send({ statusCode: error.statusCode, message: error.message })
    return
  }

  // Unexpected errors
  console.error('[Unhandled Error]', error)
  reply.status(500).send({ statusCode: 500, error: 'INTERNAL_ERROR', message: 'Internal server error' })
}
