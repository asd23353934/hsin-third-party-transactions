import { z } from 'zod'

export const CreateTransactionSchema = z.object({
  orderRef:    z.string().min(1).max(64),
  amount:      z.number().positive(),
  currency:    z.string().length(3).default('TWD'),
  gateway:     z.enum(['ecpay', 'newebpay']),
  description: z.string().max(200).optional(),
  returnUrl:   z.string().url(),
  notifyUrl:   z.string().url(),
  metadata:    z.record(z.unknown()).optional(),
})

export type CreateTransactionDto = z.infer<typeof CreateTransactionSchema>

export interface CreateTransactionResult {
  id:          string
  orderRef:    string
  amount:      number
  currency:    string
  gateway:     string
  status:      string
  paymentForm: string
  createdAt:   string
}
