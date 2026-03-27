export class TransactionId {
  private constructor(private readonly _value: string) {}

  static of(value: string): TransactionId {
    if (!value || value.trim().length === 0) throw new Error('TransactionId cannot be empty')
    return new TransactionId(value)
  }

  get value(): string {
    return this._value
  }

  equals(other: TransactionId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}

export class Money {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: string,
  ) {}

  static of(amount: number, currency = 'TWD'): Money {
    if (amount < 0) throw new Error('Amount cannot be negative')
    if (!currency || currency.length !== 3) throw new Error('Currency must be a 3-letter ISO code')
    return new Money(Math.round(amount * 100) / 100, currency.toUpperCase())
  }

  get amount(): number {
    return this._amount
  }

  get currency(): string {
    return this._currency
  }

  toString(): string {
    return `${this._amount} ${this._currency}`
  }
}

export class OrderRef {
  private constructor(private readonly _value: string) {}

  static of(value: string): OrderRef {
    if (!value || value.trim().length === 0) throw new Error('OrderRef cannot be empty')
    if (value.length > 64) throw new Error('OrderRef cannot exceed 64 characters')
    return new OrderRef(value.trim())
  }

  get value(): string {
    return this._value
  }

  toString(): string {
    return this._value
  }
}
