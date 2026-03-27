import { randomUUID } from 'node:crypto'
import { Result, ok, err } from '../../../domain/shared/result.js'
import { Transaction, EnumPaymentGateway } from '../../../domain/transaction/transaction.entity.js'
import { Money, OrderRef, TransactionId } from '../../../domain/transaction/transaction.value-objects.js'
import { DuplicateOrderRefError } from '../../../domain/transaction/transaction.errors.js'
import { ITransactionRepository } from '../../interfaces/transaction.repository.interface.js'
import { IPaymentGateway } from '../../interfaces/payment-gateway.interface.js'
import {
  CreateTransactionDto,
  CreateTransactionResult,
} from './create-transaction.dto.js'

export class CreateTransactionUseCase {
  constructor(
    private readonly txRepo: ITransactionRepository,
    private readonly gatewayMap: Map<string, IPaymentGateway>,
  ) {}

  async execute(
    dto: CreateTransactionDto,
  ): Promise<Result<CreateTransactionResult, Error>> {
    // 1. Check duplicate order ref
    const existing = await this.txRepo.findByOrderRef(dto.orderRef)
    if (existing) {
      return err(new DuplicateOrderRefError(dto.orderRef))
    }

    // 2. Get gateway
    const gateway = this.gatewayMap.get(dto.gateway)
    if (!gateway) {
      return err(new Error(`Unknown gateway: ${dto.gateway}`))
    }

    // 3. Build domain entity
    const createResult = Transaction.create({
      id:          TransactionId.of(randomUUID()),
      orderRef:    OrderRef.of(dto.orderRef),
      amount:      Money.of(dto.amount, dto.currency),
      gateway:     dto.gateway as EnumPaymentGateway,
      description: dto.description,
      metadata:    dto.metadata,
    })

    if (!createResult.ok) return err(createResult.error)

    const { transaction } = createResult.value

    // 4. Persist
    await this.txRepo.save(transaction)

    // 5. Build payment form HTML
    const formResult = gateway.buildPaymentForm({
      transactionId: transaction.id.value,
      orderRef:      dto.orderRef,
      amount:        dto.amount,
      currency:      dto.currency,
      description:   dto.description ?? dto.orderRef,
      returnUrl:     dto.returnUrl,
      notifyUrl:     dto.notifyUrl,
    })

    return ok({
      id:          transaction.id.value,
      orderRef:    transaction.orderRef.value,
      amount:      transaction.amount.amount,
      currency:    transaction.amount.currency,
      gateway:     transaction.gateway,
      status:      transaction.status,
      paymentForm: formResult.html,
      createdAt:   transaction.createdAt.toISOString(),
    })
  }
}
