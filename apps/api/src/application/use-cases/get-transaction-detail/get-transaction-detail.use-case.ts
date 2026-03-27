import { Result, ok, err } from '../../../domain/shared/result.js'
import { TransactionNotFoundError } from '../../../domain/transaction/transaction.errors.js'
import { ITransactionRepository } from '../../interfaces/transaction.repository.interface.js'

export interface TransactionDetail {
  id:          string
  orderRef:    string
  amount:      number
  currency:    string
  status:      string
  gateway:     string
  description: string | null
  gatewayRef:  string | null
  metadata:    Record<string, unknown> | null
  callbackAt:  string | null
  createdAt:   string
  updatedAt:   string
}

export class GetTransactionDetailUseCase {
  constructor(private readonly txRepo: ITransactionRepository) {}

  async execute(id: string): Promise<Result<TransactionDetail, TransactionNotFoundError>> {
    const tx = await this.txRepo.findById(id)
    if (!tx) return err(new TransactionNotFoundError(id))

    return ok({
      id:          tx.id.value,
      orderRef:    tx.orderRef.value,
      amount:      tx.amount.amount,
      currency:    tx.amount.currency,
      status:      tx.status,
      gateway:     tx.gateway,
      description: tx.description ?? null,
      gatewayRef:  tx.gatewayRef  ?? null,
      metadata:    tx.metadata    ?? null,
      callbackAt:  tx.callbackAt  ? tx.callbackAt.toISOString() : null,
      createdAt:   tx.createdAt.toISOString(),
      updatedAt:   tx.updatedAt.toISOString(),
    })
  }
}
