import { Component, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { InputNumberModule } from 'primeng/inputnumber'
import { SelectButtonModule } from 'primeng/selectbutton'
import { CardModule } from 'primeng/card'
import { MessageModule } from 'primeng/message'
import { TransactionApiService } from '../../@core/services/transaction-api.service'
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-pay',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, InputNumberModule,
    SelectButtonModule, CardModule, MessageModule,
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">線上付款</h1>
          <p class="text-gray-500 mt-1">安全快速的付款體驗</p>
        </div>

        <p-card>
          @if (errorMsg()) {
            <p-message severity="error" [text]="errorMsg()!" class="mb-4 block" />
          }

          <div class="flex flex-col gap-5">
            <!-- Amount -->
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">付款金額 (TWD)</label>
              <p-inputNumber
                [(ngModel)]="amount"
                [min]="1"
                mode="currency"
                currency="TWD"
                locale="zh-TW"
                [useGrouping]="true"
                class="w-full"
                inputStyleClass="w-full text-xl font-bold"
              />
            </div>

            <!-- Description -->
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">付款說明</label>
              <input
                pInputText
                [(ngModel)]="description"
                placeholder="請輸入付款說明"
                class="w-full"
                maxlength="200"
              />
            </div>

            <!-- Gateway -->
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-2">選擇付款方式</label>
              <p-selectButton
                [(ngModel)]="gateway"
                [options]="gatewayOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
            </div>

            <!-- Submit -->
            <p-button
              label="前往付款"
              icon="pi pi-credit-card"
              [loading]="isLoading()"
              [disabled]="!amount || !description"
              class="w-full mt-2"
              styleClass="w-full"
              (onClick)="submitPayment()"
            />
          </div>

          <div class="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <i class="pi pi-lock text-green-500"></i>
            <span>SSL 加密保護，交易安全有保障</span>
          </div>
        </p-card>

        <!-- Hidden form container for gateway redirect -->
        <div [innerHTML]="paymentFormHtml()" class="hidden"></div>
      </div>
    </div>
  `,
})
export class PayComponent {
  private readonly apiService = inject(TransactionApiService)
  private readonly sanitizer  = inject(DomSanitizer)

  amount      = 0
  description = ''
  gateway: 'ecpay' = 'ecpay'

  readonly isLoading      = signal(false)
  readonly errorMsg       = signal<string | null>(null)
  readonly paymentFormHtml = signal<SafeHtml>('')

  readonly gatewayOptions = [
    { label: '綠界 ECPay', value: 'ecpay' as const },
  ]

  submitPayment(): void {
    if (!this.amount || !this.description) return

    this.isLoading.set(true)
    this.errorMsg.set(null)

    const orderRef = `ORD-${Date.now()}`

    this.apiService
      .createTransaction({
        orderRef,
        amount:      this.amount,
        currency:    'TWD',
        gateway:     this.gateway,
        description: this.description,
        returnUrl:   `${environment.apiUrl}/api/result/${this.gateway}`,
        notifyUrl:   `${environment.apiUrl}/api/callback/${this.gateway}`,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false)
          // 直接用 document.write 替換整頁，讓 ECPay form onload 自動提交
          document.open()
          document.write(res.data.paymentForm)
          document.close()
        },
        error: (err: { error?: { message?: string } }) => {
          this.isLoading.set(false)
          this.errorMsg.set(err?.error?.message ?? '付款初始化失敗，請稍後再試')
        },
      })
  }
}
