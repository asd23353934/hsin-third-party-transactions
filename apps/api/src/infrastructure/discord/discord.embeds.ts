import {
  TransactionFailedEvent,
  TransactionSucceededEvent,
} from '../../domain/transaction/transaction.events.js'

interface DiscordEmbed {
  title:       string
  description: string
  color:       number
  fields:      Array<{ name: string; value: string; inline?: boolean }>
  footer:      { text: string }
  timestamp:   string
}

interface DiscordWebhookBody {
  username: string
  avatar_url?: string
  embeds: DiscordEmbed[]
}

const GATEWAY_LABELS: Record<string, string> = {
  ecpay:    '綠界 ECPay',
  newebpay: '藍新 NewebPay',
}

export function buildSuccessWebhookBody(event: TransactionSucceededEvent): DiscordWebhookBody {
  return {
    username: 'Spectra 交易通知',
    embeds: [
      {
        title:       '✅ 交易成功',
        description: `訂單 **${event.orderRef}** 付款成功`,
        color:       0x23d160, // green
        fields: [
          { name: '交易 ID',   value: `\`${event.transactionId}\``,                  inline: true },
          { name: '金額',       value: `**${event.amount} ${event.currency}**`,       inline: true },
          { name: '付款方式',   value: GATEWAY_LABELS[event.gateway] ?? event.gateway, inline: true },
          { name: '閘道參考',   value: `\`${event.gatewayRef}\``,                     inline: false },
        ],
        footer:    { text: 'Spectra Payment System' },
        timestamp: event.occurredAt.toISOString(),
      },
    ],
  }
}

export function buildFailureWebhookBody(event: TransactionFailedEvent): DiscordWebhookBody {
  return {
    username: 'Spectra 交易通知',
    embeds: [
      {
        title:       '❌ 交易失敗',
        description: `訂單 **${event.orderRef}** 付款失敗`,
        color:       0xff3860, // red
        fields: [
          { name: '交易 ID', value: `\`${event.transactionId}\``,                    inline: true },
          { name: '金額',     value: `**${event.amount} ${event.currency}**`,         inline: true },
          { name: '付款方式', value: GATEWAY_LABELS[event.gateway] ?? event.gateway,  inline: true },
          { name: '失敗原因', value: event.reason,                                    inline: false },
        ],
        footer:    { text: 'Spectra Payment System' },
        timestamp: event.occurredAt.toISOString(),
      },
    ],
  }
}
