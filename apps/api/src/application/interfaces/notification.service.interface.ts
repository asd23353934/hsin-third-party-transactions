import {
  TransactionFailedEvent,
  TransactionSucceededEvent,
} from '../../domain/transaction/transaction.events.js'

export interface INotificationService {
  notifySuccess(event: TransactionSucceededEvent): Promise<void>
  notifyFailure(event: TransactionFailedEvent): Promise<void>
}
