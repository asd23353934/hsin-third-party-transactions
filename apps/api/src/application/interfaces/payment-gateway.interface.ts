export interface PaymentFormParams {
  transactionId: string
  orderRef: string
  amount: number
  currency: string
  description: string
  returnUrl: string
  notifyUrl: string
}

export interface PaymentFormResult {
  /** HTML form to auto-submit to gateway */
  html: string
}

export interface CallbackPayload {
  raw: Record<string, unknown>
  gateway: string
}

export interface CallbackResult {
  transactionId: string
  orderRef: string
  success: boolean
  gatewayRef: string
  reason?: string
}

export interface IPaymentGateway {
  readonly name: string
  buildPaymentForm(params: PaymentFormParams): PaymentFormResult
  verifyCallback(payload: CallbackPayload): Promise<CallbackResult>
}
