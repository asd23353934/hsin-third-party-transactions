import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'

export interface CreateTransactionRequest {
  orderRef:    string
  amount:      number
  currency:    string
  gateway:     'ecpay'
  description: string
  returnUrl:   string
  notifyUrl:   string
  metadata?:   Record<string, unknown>
}

export interface CreateTransactionResponse {
  data: {
    id:          string
    orderRef:    string
    amount:      number
    currency:    string
    gateway:     string
    status:      string
    paymentForm: string
    createdAt:   string
  }
}

@Injectable({ providedIn: 'root' })
export class TransactionApiService {
  private readonly http = inject(HttpClient)

  createTransaction(
    body: CreateTransactionRequest,
  ): Observable<CreateTransactionResponse> {
    return this.http.post<CreateTransactionResponse>(
      `${environment.apiUrl}/api/transactions`,
      body,
    )
  }
}
