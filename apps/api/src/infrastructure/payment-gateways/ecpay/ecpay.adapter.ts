import { createHash } from 'node:crypto'
import {
  IPaymentGateway,
  PaymentFormParams,
  PaymentFormResult,
  CallbackPayload,
  CallbackResult,
} from '../../../application/interfaces/payment-gateway.interface.js'
import { getEnv } from '../../../shared/config/env.config.js'

export class EcpayAdapter implements IPaymentGateway {
  readonly name = 'ecpay'

  private get config() {
    const env = getEnv()
    return {
      merchantId: env.ECPAY_MERCHANT_ID,
      hashKey:    env.ECPAY_HASH_KEY,
      hashIv:     env.ECPAY_HASH_IV,
      apiUrl:     env.ECPAY_API_URL,
    }
  }

  buildPaymentForm(params: PaymentFormParams): PaymentFormResult {
    const { merchantId, hashKey, hashIv, apiUrl } = this.config
    const tradeDate = this.formatDate(new Date())

    const formData: Record<string, string> = {
      MerchantID:        merchantId,
      MerchantTradeNo:   params.orderRef.slice(0, 20),
      MerchantTradeDate: tradeDate,
      PaymentType:       'aio',
      TotalAmount:       Math.round(params.amount).toString(),
      TradeDesc:         encodeURIComponent(params.description),
      ItemName:          params.description.slice(0, 200),
      ReturnURL:         params.notifyUrl,
      OrderResultURL:    params.returnUrl,
      ChoosePayment:     'ALL',
      EncryptType:       '1',
      CustomField1:      params.transactionId,
    }

    formData['CheckMacValue'] = this.generateCheckMac(formData, hashKey, hashIv)

    const inputs = Object.entries(formData)
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${this.escapeHtml(v)}">`)
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

    // Verify CheckMacValue
    const received = data['CheckMacValue']
    const { CheckMacValue: _, ...rest } = data
    const expected = this.generateCheckMac(rest, hashKey, hashIv)

    if (received?.toLowerCase() !== expected.toLowerCase()) {
      throw new Error('ECPay signature mismatch')
    }

    const success  = data['RtnCode'] === '1'
    const orderRef = data['MerchantTradeNo'] ?? ''
    const txId     = data['CustomField1']    ?? data['TradeNo'] ?? ''

    return {
      transactionId: txId,
      orderRef,
      success,
      gatewayRef: data['TradeNo'] ?? '',
      reason:     success ? undefined : (data['RtnMsg'] ?? 'Payment failed'),
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private generateCheckMac(
    params: Record<string, string>,
    hashKey: string,
    hashIv: string,
  ): string {
    const sorted = Object.keys(params)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map((k) => `${k}=${params[k]}`)
      .join('&')

    const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIv}`
    const encoded = encodeURIComponent(raw)
      .toLowerCase()
      .replace(/%20/g, '+')
      .replace(/%21/g, '!')
      .replace(/%28/g, '(')
      .replace(/%29/g, ')')
      .replace(/%2a/g, '*')

    return createHash('sha256').update(encoded).digest('hex').toUpperCase()
  }

  private formatDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}
