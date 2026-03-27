import { createCipheriv, createDecipheriv, createHash } from 'node:crypto'
import {
  IPaymentGateway,
  PaymentFormParams,
  PaymentFormResult,
  CallbackPayload,
  CallbackResult,
} from '../../../application/interfaces/payment-gateway.interface.js'
import { getEnv } from '../../../shared/config/env.config.js'

export class NewebpayAdapter implements IPaymentGateway {
  readonly name = 'newebpay'

  private get config() {
    const env = getEnv()
    return {
      merchantId: env.NEWEBPAY_MERCHANT_ID,
      hashKey:    env.NEWEBPAY_HASH_KEY,
      hashIv:     env.NEWEBPAY_HASH_IV,
      apiUrl:     env.NEWEBPAY_API_URL,
    }
  }

  buildPaymentForm(params: PaymentFormParams): PaymentFormResult {
    const { merchantId, hashKey, hashIv, apiUrl } = this.config
    const timeStamp = Math.floor(Date.now() / 1000)

    const tradeInfo: Record<string, string> = {
      MerchantID:   merchantId,
      RespondType:  'JSON',
      TimeStamp:    timeStamp.toString(),
      Version:      '2.0',
      MerchantOrderNo: params.orderRef.slice(0, 30),
      Amt:          Math.round(params.amount).toString(),
      ItemDesc:     params.description.slice(0, 50),
      ReturnURL:    params.returnUrl,
      NotifyURL:    params.notifyUrl,
      OrderComment: params.transactionId,
    }

    const queryString = new URLSearchParams(tradeInfo).toString()
    const tradeInfoEncrypted = this.aesEncrypt(queryString, hashKey, hashIv)
    const tradeSha = this.generateTradeSha(tradeInfoEncrypted, hashKey, hashIv)

    const formData: Record<string, string> = {
      MerchantID:  merchantId,
      TradeInfo:   tradeInfoEncrypted,
      TradeSha:    tradeSha,
      Version:     '2.0',
    }

    const inputs = Object.entries(formData)
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`)
      .join('\n      ')

    return {
      html: `
<!DOCTYPE html>
<html>
<body onload="document.forms[0].submit()">
  <form method="post" action="${apiUrl}">
    ${inputs}
  </form>
  <p>正在跳轉到付款頁面...</p>
</body>
</html>`.trim(),
    }
  }

  async verifyCallback(payload: CallbackPayload): Promise<CallbackResult> {
    const data = payload.raw as Record<string, string>
    const { hashKey, hashIv } = this.config

    // Verify TradeSha
    const received = data['TradeSha']
    const expected = this.generateTradeSha(data['TradeInfo'] ?? '', hashKey, hashIv)

    if (received !== expected) {
      throw new Error('NewebPay TradeSha mismatch')
    }

    // Decrypt TradeInfo
    const decrypted = this.aesDecrypt(data['TradeInfo'] ?? '', hashKey, hashIv)
    const result = JSON.parse(decrypted) as Record<string, unknown>
    const info   = (result['Result'] ?? result) as Record<string, string>

    const success  = data['Status'] === 'SUCCESS'
    const orderRef = String(info['MerchantOrderNo'] ?? '')

    return {
      transactionId: String(info['OrderComment'] ?? ''),
      orderRef,
      success,
      gatewayRef: String(info['TradeNo'] ?? ''),
      reason:     success ? undefined : String(data['Message'] ?? 'Payment failed'),
    }
  }

  // ── Crypto helpers ─────────────────────────────────────────────────────────
  private aesEncrypt(data: string, key: string, iv: string): string {
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv))
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  }

  private aesDecrypt(data: string, key: string, iv: string): string {
    const decipher = createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv))
    let decrypted = decipher.update(data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  private generateTradeSha(tradeInfo: string, key: string, iv: string): string {
    const raw = `HashKey=${key}&${tradeInfo}&HashIV=${iv}`
    return createHash('sha256').update(raw).digest('hex').toUpperCase()
  }
}
