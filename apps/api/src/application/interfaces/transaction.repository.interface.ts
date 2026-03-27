import { Transaction } from '../../domain/transaction/transaction.entity.js'
import { EnumTransactionStatus } from '../../domain/transaction/transaction.entity.js'

export interface TransactionFilter {
  status?: EnumTransactionStatus
  gateway?: string
  startDate?: Date
  endDate?: Date
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>
  findByOrderRef(orderRef: string): Promise<Transaction | null>
  findMany(filter: TransactionFilter, pagination: PaginationOptions): Promise<PaginatedResult<Transaction>>
  save(transaction: Transaction): Promise<void>
  update(transaction: Transaction): Promise<void>
}
