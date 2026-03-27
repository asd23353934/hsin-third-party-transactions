import { INotificationService } from '../../application/interfaces/notification.service.interface.js'
import {
  TransactionFailedEvent,
  TransactionSucceededEvent,
} from '../../domain/transaction/transaction.events.js'
import { buildFailureWebhookBody, buildSuccessWebhookBody } from './discord.embeds.js'
import { getDiscordConfig } from './discord.config.js'

export class DiscordNotificationService implements INotificationService {
  private readonly successUrl: string
  private readonly failedUrl:  string

  constructor() {
    const config = getDiscordConfig()
    this.successUrl = config.webhookUrlSuccess
    this.failedUrl  = config.webhookUrlFailed
  }

  async notifySuccess(event: TransactionSucceededEvent): Promise<void> {
    await this.send(this.successUrl, buildSuccessWebhookBody(event))
  }

  async notifyFailure(event: TransactionFailedEvent): Promise<void> {
    await this.send(this.failedUrl, buildFailureWebhookBody(event))
  }

  private async send(webhookUrl: string, body: unknown): Promise<void> {
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Discord webhook failed: ${res.status} ${text}`)
    }
  }
}
