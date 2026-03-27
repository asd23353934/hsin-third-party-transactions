import { z } from 'zod'
import { EnumTransactionStatus } from '../../../domain/transaction/transaction.entity.js'

export const ListTransactionsSchema = z.object({
  status:    z.nativeEnum(EnumTransactionStatus).optional(),
  gateway:   z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate:   z.string().datetime().optional(),
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
})

export type ListTransactionsDto = z.infer<typeof ListTransactionsSchema>

export interface TransactionSummary {
  id:         string
  orderRef:   string
  amount:     number
  currency:   string
  status:     string
  gateway:    string
  gatewayRef: string | null
  createdAt:  string
  updatedAt:  string
}

export interface ListTransactionsResult {
  data:  TransactionSummary[]
  total: number
  page:  number
  limit: number
}
