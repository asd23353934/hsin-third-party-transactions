export interface HandlePaymentCallbackDto {
  gateway: string
  rawPayload: Record<string, unknown>
}
