import { Component, OnInit, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { ButtonModule } from 'primeng/button'
import { CardModule } from 'primeng/card'

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <p-card>
          <div class="flex flex-col items-center text-center py-6 gap-4">
            @if (isSuccess()) {
              <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <i class="pi pi-check text-green-500 text-4xl"></i>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-900">付款成功！</h2>
                <p class="text-gray-500 mt-1">您的交易已完成</p>
              </div>
              @if (orderRef()) {
                <div class="bg-gray-50 rounded-lg p-3 w-full text-left">
                  <p class="text-xs text-gray-400 font-medium">訂單編號</p>
                  <p class="font-mono text-sm font-semibold mt-1">{{ orderRef() }}</p>
                </div>
              }
            } @else {
              <div class="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <i class="pi pi-times text-red-500 text-4xl"></i>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-900">付款失敗</h2>
                <p class="text-gray-500 mt-1">{{ errorMessage() }}</p>
              </div>
              <p-button
                label="重新嘗試"
                icon="pi pi-refresh"
                routerLink="/"
                class="mt-2"
              />
            }
          </div>
        </p-card>
      </div>
    </div>
  `,
})
export class ResultComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)

  readonly isSuccess    = signal(false)
  readonly orderRef     = signal<string | null>(null)
  readonly errorMessage = signal('交易未完成，請重新嘗試')

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap
    // ECPay returns RtnCode=1 for success; NewebPay returns Status=SUCCESS
    const rtnCode = params.get('RtnCode')
    const status  = params.get('Status')
    const orderRef = params.get('orderRef') ?? params.get('MerchantTradeNo') ?? params.get('MerchantOrderNo')

    const success = rtnCode === '1' || status === 'SUCCESS'
    this.isSuccess.set(success)
    this.orderRef.set(orderRef)

    if (!success) {
      const msg = params.get('RtnMsg') ?? params.get('Message')
      if (msg) this.errorMessage.set(msg)
    }
  }
}
