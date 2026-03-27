import { Injectable, computed, inject, signal } from '@angular/core'
import { Transaction, TransactionListFilter } from '../models/transaction.model'
import { TransactionService } from './transaction.service'

@Injectable({ providedIn: 'root' })
export class TransactionStateService {
  private readonly txService = inject(TransactionService)

  // #region State
  readonly transactions = signal<Transaction[]>([])
  readonly isLoading    = signal(false)
  readonly total        = signal(0)
  readonly currentPage  = signal(1)
  readonly pageSize     = signal(20)
  // #endregion

  // #region Computed
  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()))
  // #endregion

  loadTransactions(filter: Partial<TransactionListFilter> = {}): void {
    this.isLoading.set(true)
    this.txService
      .getTransactions({
        page:  this.currentPage(),
        limit: this.pageSize(),
        ...filter,
      })
      .subscribe({
        next: (res) => {
          this.transactions.set(res.data.data)
          this.total.set(res.data.total)
          this.isLoading.set(false)
        },
        error: () => this.isLoading.set(false),
      })
  }

  changePage(page: number, filter: Partial<TransactionListFilter> = {}): void {
    this.currentPage.set(page)
    this.loadTransactions(filter)
  }
}
