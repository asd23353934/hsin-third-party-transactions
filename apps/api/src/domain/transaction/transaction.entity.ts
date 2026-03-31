import { Result, ok, err } from '../shared/result.js'
import { Money, OrderRef, TransactionId } from './transaction.value-objects.js'
import {
  TransactionCreatedEvent,
  TransactionFailedEvent,
  TransactionSucceededEvent,
} from './transaction.events.js'
import { InvalidTransactionStateError } from './transaction.errors.js'

// ── Status ─────────────────────────────────────────────────────────────────
export enum EnumTransactionStatus {
  pending    = 'pending',
  processing = 'processing',
  success    = 'success',
  failed     = 'failed',
  timeout    = 'timeout',
  cancelled  = 'cancelled',
  refunded   = 'refunded',
}

export enum EnumPaymentGateway {
  ecpay = 'ecpay',
}

// ── Valid transitions ──────────────────────────────────────────────────────
const ALLOWED_TRANSITIONS: Partial<Record<EnumTransactionStatus, EnumTransactionStatus[]>> = {
  [EnumTransactionStatus.pending]:    [EnumTransactionStatus.processing, EnumTransactionStatus.cancelled],
  [EnumTransactionStatus.processing]: [EnumTransactionStatus.success, EnumTransactionStatus.failed, EnumTransactionStatus.timeout],
  [EnumTransactionStatus.success]:    [EnumTransactionStatus.refunded],
}

// ── Props ──────────────────────────────────────────────────────────────────
export interface TransactionProps {
  id: TransactionId
  orderRef: OrderRef
  amount: Money
  status: EnumTransactionStatus
  gateway: EnumPaymentGateway
  description?: string
  gatewayRef?: string
  metadata?: Record<string, unknown>
  callbackAt?: Date
  createdAt: Date
  updatedAt: Date
}

// ── Entity ─────────────────────────────────────────────────────────────────
export class Transaction {
  private constructor(private props: TransactionProps) {}

  // ── Factory ──────────────────────────────────────────────────────────────
  static create(
    params: Omit<TransactionProps, 'status' | 'createdAt' | 'updatedAt'>,
  ): Result<{ transaction: Transaction; event: TransactionCreatedEvent }, Error> {
    const transaction = new Transaction({
      ...params,
      status: EnumTransactionStatus.pending,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const event = new TransactionCreatedEvent(
      params.id.value,
      params.orderRef.value,
      params.amount.amount,
      params.amount.currency,
      params.gateway,
    )

    return ok({ transaction, event })
  }

  static reconstitute(props: TransactionProps): Transaction {
    return new Transaction(props)
  }

  // ── Transitions ──────────────────────────────────────────────────────────
  private canTransitionTo(next: EnumTransactionStatus): boolean {
    return ALLOWED_TRANSITIONS[this.props.status]?.includes(next) ?? false
  }

  markProcessing(): Result<void, InvalidTransactionStateError> {
    if (!this.canTransitionTo(EnumTransactionStatus.processing)) {
      return err(new InvalidTransactionStateError(this.props.status, EnumTransactionStatus.processing))
    }
    this.props.status = EnumTransactionStatus.processing
    this.props.updatedAt = new Date()
    return ok(undefined)
  }

  markSuccess(
    gatewayRef: string,
  ): Result<TransactionSucceededEvent, InvalidTransactionStateError> {
    if (!this.canTransitionTo(EnumTransactionStatus.success)) {
      return err(new InvalidTransactionStateError(this.props.status, EnumTransactionStatus.success))
    }
    this.props.status    = EnumTransactionStatus.success
    this.props.gatewayRef = gatewayRef
    this.props.callbackAt = new Date()
    this.props.updatedAt  = new Date()

    return ok(
      new TransactionSucceededEvent(
        this.props.id.value,
        this.props.orderRef.value,
        this.props.amount.amount,
        this.props.amount.currency,
        this.props.gateway,
        gatewayRef,
      ),
    )
  }

  markFailed(reason: string): Result<TransactionFailedEvent, InvalidTransactionStateError> {
    if (!this.canTransitionTo(EnumTransactionStatus.failed)) {
      return err(new InvalidTransactionStateError(this.props.status, EnumTransactionStatus.failed))
    }
    this.props.status    = EnumTransactionStatus.failed
    this.props.callbackAt = new Date()
    this.props.updatedAt  = new Date()

    return ok(
      new TransactionFailedEvent(
        this.props.id.value,
        this.props.orderRef.value,
        this.props.amount.amount,
        this.props.amount.currency,
        this.props.gateway,
        reason,
      ),
    )
  }

  markTimeout(): Result<void, InvalidTransactionStateError> {
    if (!this.canTransitionTo(EnumTransactionStatus.timeout)) {
      return err(new InvalidTransactionStateError(this.props.status, EnumTransactionStatus.timeout))
    }
    this.props.status    = EnumTransactionStatus.timeout
    this.props.callbackAt = new Date()
    this.props.updatedAt  = new Date()
    return ok(undefined)
  }

  cancel(): Result<void, InvalidTransactionStateError> {
    if (!this.canTransitionTo(EnumTransactionStatus.cancelled)) {
      return err(new InvalidTransactionStateError(this.props.status, EnumTransactionStatus.cancelled))
    }
    this.props.status   = EnumTransactionStatus.cancelled
    this.props.updatedAt = new Date()
    return ok(undefined)
  }

  // ── Getters ───────────────────────────────────────────────────────────────
  get id():          TransactionId          { return this.props.id }
  get orderRef():    OrderRef               { return this.props.orderRef }
  get amount():      Money                  { return this.props.amount }
  get status():      EnumTransactionStatus  { return this.props.status }
  get gateway():     EnumPaymentGateway     { return this.props.gateway }
  get description(): string | undefined     { return this.props.description }
  get gatewayRef():  string | undefined     { return this.props.gatewayRef }
  get metadata():    Record<string, unknown> | undefined { return this.props.metadata }
  get callbackAt():  Date | undefined       { return this.props.callbackAt }
  get createdAt():   Date                   { return this.props.createdAt }
  get updatedAt():   Date                   { return this.props.updatedAt }
}
