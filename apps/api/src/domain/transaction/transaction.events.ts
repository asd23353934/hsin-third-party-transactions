export interface DomainEvent {
  readonly eventName: string
  readonly occurredAt: Date
  readonly transactionId: string
}

export class TransactionCreatedEvent implements DomainEvent {
  readonly eventName = 'transaction.created'
  readonly occurredAt = new Date()

  constructor(
    readonly transactionId: string,
    readonly orderRef: string,
    readonly amount: number,
    readonly currency: string,
    readonly gateway: string,
  ) {}
}

export class TransactionSucceededEvent implements DomainEvent {
  readonly eventName = 'transaction.succeeded'
  readonly occurredAt = new Date()

  constructor(
    readonly transactionId: string,
    readonly orderRef: string,
    readonly amount: number,
    readonly currency: string,
    readonly gateway: string,
    readonly gatewayRef: string,
  ) {}
}

export class TransactionFailedEvent implements DomainEvent {
  readonly eventName = 'transaction.failed'
  readonly occurredAt = new Date()

  constructor(
    readonly transactionId: string,
    readonly orderRef: string,
    readonly amount: number,
    readonly currency: string,
    readonly gateway: string,
    readonly reason: string,
  ) {}
}
