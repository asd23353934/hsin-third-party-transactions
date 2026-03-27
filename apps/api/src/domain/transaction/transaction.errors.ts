export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'TransactionError'
  }
}

export class InvalidTransactionStateError extends TransactionError {
  constructor(from: string, to: string) {
    super(`Cannot transition from '${from}' to '${to}'`, 'INVALID_STATE_TRANSITION')
  }
}

export class TransactionNotFoundError extends TransactionError {
  constructor(id: string) {
    super(`Transaction '${id}' not found`, 'TRANSACTION_NOT_FOUND')
  }
}

export class DuplicateOrderRefError extends TransactionError {
  constructor(orderRef: string) {
    super(`Order ref '${orderRef}' already exists`, 'DUPLICATE_ORDER_REF')
  }
}

export class InvalidSignatureError extends TransactionError {
  constructor() {
    super('Gateway signature verification failed', 'INVALID_SIGNATURE')
  }
}
