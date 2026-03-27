import { Component, OnInit, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { TableModule, TablePageEvent } from 'primeng/table'
import { TagModule } from 'primeng/tag'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { SelectModule } from 'primeng/select'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { TransactionStateService } from '../services/transaction-state.service'
import {
  EnumTransactionStatus,
  EnumPaymentGateway,
  STATUS_LABEL,
  STATUS_SEVERITY,
  TransactionListFilter,
} from '../models/transaction.model'

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    TableModule, TagModule, ButtonModule, InputTextModule, SelectModule, ProgressSpinnerModule,
  ],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">交易記錄</h1>
        <span class="text-sm text-gray-500">共 {{ state.total() }} 筆</span>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3 mb-4">
        <p-select
          [(ngModel)]="filterStatus"
          [options]="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="所有狀態"
          [showClear]="true"
          (onChange)="applyFilter()"
        />
        <p-select
          [(ngModel)]="filterGateway"
          [options]="gatewayOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="所有付款方式"
          [showClear]="true"
          (onChange)="applyFilter()"
        />
        <p-button
          label="重置"
          severity="secondary"
          [text]="true"
          (onClick)="resetFilter()"
        />
      </div>

      <!-- Table -->
      <p-table
        [value]="state.transactions()"
        [loading]="state.isLoading()"
        [paginator]="true"
        [rows]="state.pageSize()"
        [totalRecords]="state.total()"
        [lazy]="true"
        (onPage)="onPageChange($event)"
        styleClass="p-datatable-gridlines"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>訂單編號</th>
            <th>金額</th>
            <th>付款方式</th>
            <th>狀態</th>
            <th>建立時間</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-tx>
          <tr>
            <td class="font-mono text-sm">{{ tx.order_ref }}</td>
            <td class="font-semibold">{{ tx.amount | number:'1.2-2' }} {{ tx.currency }}</td>
            <td>{{ tx.gateway === 'ecpay' ? '綠界 ECPay' : '藍新 NewebPay' }}</td>
            <td>
              <p-tag
                [value]="getStatusLabel(tx.status)"
                [severity]="getStatusSeverity(tx.status)"
              />
            </td>
            <td class="text-sm text-gray-600">{{ tx.created_at | date:'yyyy/MM/dd HH:mm' }}</td>
            <td>
              <p-button
                label="詳情"
                [text]="true"
                size="small"
                [routerLink]="['/transactions', tx.id]"
              />
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" class="text-center py-8 text-gray-400">尚無交易記錄</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class TransactionListComponent implements OnInit {
  protected readonly state = inject(TransactionStateService)

  filterStatus:  EnumTransactionStatus | null = null
  filterGateway: EnumPaymentGateway    | null = null

  readonly statusOptions = Object.values(EnumTransactionStatus).map((v) => ({
    label: STATUS_LABEL[v],
    value: v,
  }))

  readonly gatewayOptions = [
    { label: '綠界 ECPay',    value: EnumPaymentGateway.ecpay },
    { label: '藍新 NewebPay', value: EnumPaymentGateway.newebpay },
  ]

  ngOnInit(): void {
    this.state.loadTransactions()
  }

  applyFilter(): void {
    this.state.changePage(1, {
      ...(this.filterStatus  && { status:  this.filterStatus }),
      ...(this.filterGateway && { gateway: this.filterGateway }),
    })
  }

  resetFilter(): void {
    this.filterStatus  = null
    this.filterGateway = null
    this.state.changePage(1)
  }

  onPageChange(event: TablePageEvent): void {
    const page = event.first != null && event.rows ? Math.floor(event.first / event.rows) + 1 : 1
    this.state.changePage(page, {
      ...(this.filterStatus  && { status:  this.filterStatus }),
      ...(this.filterGateway && { gateway: this.filterGateway }),
    })
  }

  getStatusLabel(status: EnumTransactionStatus): string {
    return STATUS_LABEL[status] ?? status
  }

  getStatusSeverity(status: EnumTransactionStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return STATUS_SEVERITY[status] ?? 'info'
  }
}
