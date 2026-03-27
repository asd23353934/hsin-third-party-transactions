import { IPaymentGateway } from '../../application/interfaces/payment-gateway.interface.js'
import { EcpayAdapter } from './ecpay/ecpay.adapter.js'
import { NewebpayAdapter } from './newebpay/newebpay.adapter.js'

export function buildGatewayMap(): Map<string, IPaymentGateway> {
  const map = new Map<string, IPaymentGateway>()
  const ecpay    = new EcpayAdapter()
  const newebpay = new NewebpayAdapter()
  map.set(ecpay.name, ecpay)
  map.set(newebpay.name, newebpay)
  return map
}
