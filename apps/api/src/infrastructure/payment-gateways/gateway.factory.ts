import { IPaymentGateway } from '../../application/interfaces/payment-gateway.interface.js'
import { EcpayAdapter } from './ecpay/ecpay.adapter.js'

export function buildGatewayMap(): Map<string, IPaymentGateway> {
  const map = new Map<string, IPaymentGateway>()
  const ecpay = new EcpayAdapter()
  map.set(ecpay.name, ecpay)
  return map
}
