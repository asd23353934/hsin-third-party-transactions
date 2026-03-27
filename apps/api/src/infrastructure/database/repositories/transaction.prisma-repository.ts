import { PrismaClient } from '@prisma/client'
import { Transaction, EnumTransactionStatus, EnumPaymentGateway } from '../../../domain/transaction/transaction.entity.js'
import { TransactionId, Money, OrderRef } from '../../../domain/transaction/transaction.value-objects.js'
import {
  ITransactionRepository,
  TransactionFilter,
  PaginationOptions,
  PaginatedResult,
} from '../../../application/interfaces/transaction.repository.interface.js'

export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.prisma.transaction.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async findByOrderRef(orderRef: string): Promise<Transaction | null> {
    const row = await this.prisma.transaction.findUnique({ where: { order_ref: orderRef } })
    return row ? this.toDomain(row) : null
  }

  async findMany(
    filter: TransactionFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Transaction>> {
    const where = {
      ...(filter.status    && { status: filter.status }),
      ...(filter.gateway   && { gateway: filter.gateway }),
      ...(filter.startDate || filter.endDate
        ? {
            created_at: {
              ...(filter.startDate && { gte: filter.startDate }),
              ...(filter.endDate   && { lte: filter.endDate }),
            },
          }
        : {}),
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip:    (pagination.page - 1) * pagination.limit,
        take:    pagination.limit,
      }),
      this.prisma.transaction.count({ where }),
    ])

    return {
      data:  rows.map((r) => this.toDomain(r)),
      total,
      page:  pagination.page,
      limit: pagination.limit,
    }
  }

  async save(transaction: Transaction): Promise<void> {
    await this.prisma.transaction.create({
      data: this.toPersistence(transaction),
    })
  }

  async update(transaction: Transaction): Promise<void> {
    await this.prisma.transaction.update({
      where: { id: transaction.id.value },
      data:  this.toPersistence(transaction),
    })
  }

  // ── Mappers ────────────────────────────────────────────────────────────────
  private toDomain(row: {
    id: string; order_ref: string; amount: unknown; currency: string; status: string
    gateway: string; description: string | null; gateway_ref: string | null
    metadata: unknown; callback_at: Date | null; created_at: Date; updated_at: Date
  }): Transaction {
    return Transaction.reconstitute({
      id:          TransactionId.of(row.id),
      orderRef:    OrderRef.of(row.order_ref),
      amount:      Money.of(Number(row.amount), row.currency),
      status:      row.status as EnumTransactionStatus,
      gateway:     row.gateway as EnumPaymentGateway,
      description: row.description ?? undefined,
      gatewayRef:  row.gateway_ref ?? undefined,
      metadata:    row.metadata ? (row.metadata as Record<string, unknown>) : undefined,
      callbackAt:  row.callback_at ?? undefined,
      createdAt:   row.created_at,
      updatedAt:   row.updated_at,
    })
  }

  private toPersistence(tx: Transaction) {
    return {
      id:          tx.id.value,
      order_ref:   tx.orderRef.value,
      amount:      tx.amount.amount,
      currency:    tx.amount.currency,
      status:      tx.status,
      gateway:     tx.gateway,
      description: tx.description ?? null,
      gateway_ref: tx.gatewayRef  ?? null,
      metadata:    tx.metadata    ?? null,
      callback_at: tx.callbackAt  ?? null,
      updated_at:  tx.updatedAt,
    }
  }
}
