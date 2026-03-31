export enum EnumTransactionStatus {
  pending    = 'pending',
  processing = 'processing',
  success    = 'success',
  failed     = 'failed',
  timeout    = 'timeout',
  cancelled  = 'cancelled',
  refunded   = 'refunded',
}

export enum EnumPaymentGateway {
  ecpay = 'ecpay',
}

export interface Transaction {
  id:          string
  order_ref:   string
  amount:      number
  currency:    string
  status:      EnumTransactionStatus
  gateway:     EnumPaymentGateway
  description: string | null
  gateway_ref: string | null
  metadata:    Record<string, unknown> | null
  callback_at: string | null
  created_at:  string
  updated_at:  string
}

export interface TransactionListFilter {
  status?:    EnumTransactionStatus
  gateway?:   EnumPaymentGateway
  startDate?: string
  endDate?:   string
  page:       number
  limit:      number
}

export const STATUS_LABEL: Record<EnumTransactionStatus, string> = {
  [EnumTransactionStatus.pending]:    '待處理',
  [EnumTransactionStatus.processing]: '處理中',
  [EnumTransactionStatus.success]:    '成功',
  [EnumTransactionStatus.failed]:     '失敗',
  [EnumTransactionStatus.timeout]:    '逾時',
  [EnumTransactionStatus.cancelled]:  '已取消',
  [EnumTransactionStatus.refunded]:   '已退款',
}

export const STATUS_SEVERITY: Record<EnumTransactionStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
  [EnumTransactionStatus.pending]:    'warn',
  [EnumTransactionStatus.processing]: 'info',
  [EnumTransactionStatus.success]:    'success',
  [EnumTransactionStatus.failed]:     'danger',
  [EnumTransactionStatus.timeout]:    'warn',
  [EnumTransactionStatus.cancelled]:  'secondary',
  [EnumTransactionStatus.refunded]:   'secondary',
}
