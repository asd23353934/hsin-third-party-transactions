import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../../environments/environment'
import {
  APIResponse,
  APIPaginationResponse,
} from '../../../@core/models/api-response'
import { Transaction, TransactionListFilter } from '../models/transaction.model'

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient)
  private readonly base = `${environment.apiUrl}/api/transactions`

  getTransactions(filter: TransactionListFilter): Observable<APIPaginationResponse<Transaction[]>> {
    let params = new HttpParams()
      .set('page',  filter.page.toString())
      .set('limit', filter.limit.toString())

    if (filter.status)    params = params.set('status',    filter.status)
    if (filter.gateway)   params = params.set('gateway',   filter.gateway)
    if (filter.startDate) params = params.set('startDate', filter.startDate)
    if (filter.endDate)   params = params.set('endDate',   filter.endDate)

    return this.http.get<APIPaginationResponse<Transaction[]>>(this.base, { params })
  }

  getTransactionDetail(id: string): Observable<APIResponse<Transaction>> {
    return this.http.get<APIResponse<Transaction>>(`${this.base}/${id}`)
  }
}
