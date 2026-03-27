import { Component, OnInit, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { TagModule } from 'primeng/tag'
import { ButtonModule } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { TransactionService } from '../services/transaction.service'
import {
  Transaction,
  STATUS_LABEL,
  STATUS_SEVERITY,
  EnumTransactionStatus,
} from '../models/transaction.model'

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    TagModule, ButtonModule, CardModule, ProgressSpinnerModule,
  ],
  template: `
    <div class="p-6 max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <p-button label="返回" icon="pi pi-arrow-left" [text]="true" routerLink="/transactions" />
        <h1 class="text-2xl font-bold text-gray-900">交易詳情</h1>
      </div>

      @if (isLoading()) {
        <div class="flex justify-center py-12">
          <p-progressSpinner />
        </div>
      }

      @if (transaction(); as tx) {
        <p-card>
          <div class="grid grid-cols-2 gap-x-8 gap-y-4">
            <div class="col-span-2 flex items-center justify-between border-b pb-3 mb-2">
              <span class="text-lg font-semibold font-mono">{{ tx.order_ref }}</span>
              <p-tag
                [value]="getStatusLabel(tx.status)"
                [severity]="getStatusSeverity(tx.status)"
              />
            </div>

            <div class="field">
              <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">交易 ID</label>
              <p class="font-mono text-sm mt-1">{{ tx.id }}</p>
            </div>

            <div class="field">
              <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">付款方式</label>
              <p class="mt-1">{{ tx.gateway === 'ecpay' ? '綠界 ECPay' : '藍新 NewebPay' }}</p>
            </div>

            <div class="field">
              <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">金額</label>
              <p class="text-lg font-bold mt-1">{{ tx.amount | number:'1.2-2' }} {{ tx.currency }}</p>
            </div>

            <div class="field">
              <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">閘道參考號</label>
              <p class="font-mono text-sm mt-1">{{ tx.gateway_ref ?? '—' }}</p>
            </div>

            @if (tx.description) {
              <div class="field col-span-2">
                <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">說明</label>
                <p class="mt-1">{{ tx.description }}</p>
              </div>
            }

            <div class="field">
              <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">建立時間</label>
              <p class="mt-1">{{ tx.created_at | date:'yyyy/MM/dd HH:mm:ss' }}</p>
            </div>

            <div class="field">
              <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">回調時間</label>
              <p class="mt-1">{{ tx.callback_at ? (tx.callback_at | date:'yyyy/MM/dd HH:mm:ss') : '—' }}</p>
            </div>

            @if (tx.metadata) {
              <div class="field col-span-2">
                <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Metadata</label>
                <pre class="mt-1 bg-gray-50 rounded p-3 text-xs overflow-auto">{{ tx.metadata | json }}</pre>
              </div>
            }
          </div>
        </p-card>
      }
    </div>
  `,
})
export class TransactionDetailComponent implements OnInit {
  private readonly route   = inject(ActivatedRoute)
  private readonly txService = inject(TransactionService)

  readonly transaction = signal<Transaction | null>(null)
  readonly isLoading   = signal(true)

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? ''
    this.txService.getTransactionDetail(id).subscribe({
      next: (res) => {
        this.transaction.set(res.data)
        this.isLoading.set(false)
      },
      error: () => this.isLoading.set(false),
    })
  }

  getStatusLabel(status: EnumTransactionStatus): string {
    return STATUS_LABEL[status] ?? status
  }

  getStatusSeverity(status: EnumTransactionStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return STATUS_SEVERITY[status] ?? 'info'
  }
}
