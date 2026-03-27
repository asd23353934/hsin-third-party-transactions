import { Result, ok } from '../../../domain/shared/result.js'
import { ITransactionRepository } from '../../interfaces/transaction.repository.interface.js'
import { ListTransactionsDto, ListTransactionsResult, TransactionSummary } from './list-transactions.dto.js'
import { Transaction } from '../../../domain/transaction/transaction.entity.js'

export class ListTransactionsUseCase {
  constructor(private readonly txRepo: ITransactionRepository) {}

  async execute(dto: ListTransactionsDto): Promise<Result<ListTransactionsResult, never>> {
    const result = await this.txRepo.findMany(
      {
        status:    dto.status,
        gateway:   dto.gateway,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate:   dto.endDate   ? new Date(dto.endDate)   : undefined,
      },
      { page: dto.page, limit: dto.limit },
    )

    return ok({
      data:  result.data.map(this.toSummary),
      total: result.total,
      page:  result.page,
      limit: result.limit,
    })
  }

  private toSummary(tx: Transaction): TransactionSummary {
    return {
      id:         tx.id.value,
      orderRef:   tx.orderRef.value,
      amount:     tx.amount.amount,
      currency:   tx.amount.currency,
      status:     tx.status,
      gateway:    tx.gateway,
      gatewayRef: tx.gatewayRef ?? null,
      createdAt:  tx.createdAt.toISOString(),
      updatedAt:  tx.updatedAt.toISOString(),
    }
  }
}
