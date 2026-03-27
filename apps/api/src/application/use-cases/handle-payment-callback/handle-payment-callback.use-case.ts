import { Result, ok, err } from '../../../domain/shared/result.js'
import { TransactionNotFoundError, InvalidSignatureError } from '../../../domain/transaction/transaction.errors.js'
import { ITransactionRepository } from '../../interfaces/transaction.repository.interface.js'
import { INotificationService } from '../../interfaces/notification.service.interface.js'
import { IPaymentGateway } from '../../interfaces/payment-gateway.interface.js'
import { HandlePaymentCallbackDto } from './handle-payment-callback.dto.js'

export class HandlePaymentCallbackUseCase {
  constructor(
    private readonly txRepo:           ITransactionRepository,
    private readonly notificationSvc:  INotificationService,
    private readonly gatewayMap:       Map<string, IPaymentGateway>,
  ) {}

  async execute(
    dto: HandlePaymentCallbackDto,
  ): Promise<Result<void, TransactionNotFoundError | InvalidSignatureError | Error>> {
    // 1. Get gateway adapter
    const gateway = this.gatewayMap.get(dto.gateway)
    if (!gateway) return err(new Error(`Unknown gateway: ${dto.gateway}`))

    // 2. Verify signature + parse callback
    let callbackResult
    try {
      callbackResult = await gateway.verifyCallback({ raw: dto.rawPayload, gateway: dto.gateway })
    } catch {
      return err(new InvalidSignatureError())
    }

    // 3. Load transaction
    const tx = await this.txRepo.findByOrderRef(callbackResult.orderRef)
    if (!tx) return err(new TransactionNotFoundError(callbackResult.orderRef))

    // 4. Transition state
    if (callbackResult.success) {
      const transitionResult = tx.markSuccess(callbackResult.gatewayRef)
      if (!transitionResult.ok) return err(transitionResult.error)

      await this.txRepo.update(tx)

      // 5a. Notify Discord success (fire-and-forget; errors are logged, not propagated)
      this.notificationSvc.notifySuccess(transitionResult.value).catch((e: unknown) => {
        console.error('[Discord] Failed to send success notification', e)
      })
    } else {
      const transitionResult = tx.markFailed(callbackResult.reason ?? 'Unknown reason')
      if (!transitionResult.ok) return err(transitionResult.error)

      await this.txRepo.update(tx)

      // 5b. Notify Discord failure
      this.notificationSvc.notifyFailure(transitionResult.value).catch((e: unknown) => {
        console.error('[Discord] Failed to send failure notification', e)
      })
    }

    return ok(undefined)
  }
}
