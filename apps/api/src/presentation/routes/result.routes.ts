import type { FastifyInstance } from 'fastify'
import { getEnv } from '../../shared/config/env.config.js'

/**
 * GET/POST /api/result/:gateway
 *
 * ECPay 付款完成後，閘道以 POST 方式將結果推送到此端點（OrderResultURL）。
 * 由於前端是純 SPA，無法直接接收 POST body，因此這裡負責：
 * 1. 解析閘道 POST 的結果參數
 * 2. 以 GET redirect 將結果帶回前端 /result 頁面
 */
export async function resultRoutes(app: FastifyInstance): Promise<void> {
  const env = getEnv()

  // ECPay POST → redirect to frontend /result
  app.post<{ Params: { gateway: string }; Body: Record<string, string> }>(
    '/api/result/:gateway',
    async (request, reply) => {
      const { gateway } = request.params
      const body        = (request.body ?? {}) as Record<string, string>

      let rtnCode  = ''
      let rtnMsg   = ''
      let orderRef = ''

      if (gateway === 'ecpay') {
        rtnCode  = body['RtnCode']          ?? ''
        rtnMsg   = body['RtnMsg']           ?? ''
        orderRef = body['MerchantTradeNo']  ?? body['CustomField1'] ?? ''
      }

      const params = new URLSearchParams({
        RtnCode:  rtnCode,
        orderRef,
        ...(rtnMsg ? { RtnMsg: rtnMsg } : {}),
      })

      return reply.redirect(`${env.FRONTEND_URL}/result?${params.toString()}`, 302)
    },
  )
}
