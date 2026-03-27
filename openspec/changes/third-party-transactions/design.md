# Design: 第三方交易系統

## Context

全新專案，從零開始建立。系統需要整合台灣主流第三方付款閘道（ECPay、NewebPay），提供付款頁面給消費者，後台管理界面給內部人員，並在交易完成時即時通知 Discord。

主要挑戰：
1. 付款閘道的回調（Callback）是非同步的，且閘道在未收到 200 OK 時會重試
2. 兩個閘道的簽章算法不同（ECPay: SHA256 CheckMacValue；NewebPay: AES + TradeSha）
3. 交易狀態需要嚴格控制，避免重複處理或非法狀態跳轉

## Goals / Non-Goals

**Goals:**
- 支援 ECPay 與 NewebPay 付款流程（建立表單 + 驗證回調）
- 完整交易狀態機（pending/processing/success/failed/timeout/cancelled/refunded）
- Discord 即時通知（成功/失敗分頻道）
- Clean Architecture 確保可測試性與可維護性
- 部署至 Railway（API）+ Vercel（前端）

**Non-Goals:**
- 不實作退款 API（狀態機保留 refunded，但不對接閘道退款流程）
- 不實作使用者登入認證（後台以 API Key 保護即可，MVP 階段）
- 不實作訂閱/定期扣款
- 不支援多幣別換算（只儲存原始幣別）

## Decisions

### 使用 Clean Architecture 分層

**決策**: 採用 Domain → Application → Infrastructure → Presentation 四層架構。

**理由**:
- Domain 層純 TypeScript class，無框架依賴，可在 Vitest 中直接 unit test
- Application 層透過 interface 依賴 Infrastructure，方便 mock 測試
- 替換付款閘道或通知方式只需新增 Infrastructure 實作，不改 Use Case

**替代方案考慮**: 直接在 Fastify route handler 寫業務邏輯 → 拒絕，因為難以測試且閘道替換成本高。

### Callback 先回 200 再非同步處理

**決策**: 收到閘道 Callback 後立即回應 `200 OK`，再 async 處理狀態更新與 Discord 通知。

**理由**:
- ECPay/NewebPay 若在 3 秒內未收到 200 會重試，重試可能導致重複處理
- 先儲存 `PaymentCallback` 原始 payload 作為稽核紀錄
- Discord 通知失敗只 log，不影響主流程

**替代方案考慮**: 使用 Queue（Bull/Redis）→ 對 MVP 過於複雜，保留為未來優化方向。

### Discord 使用 Webhook 而非 Bot

**決策**: 使用 Discord Webhook URL（channel settings → Integrations → Webhooks）。

**理由**:
- 無需 Discord Developer Portal 或 Bot Token
- 無需任何 Discord library，原生 `fetch` 即可
- 單向通知場景，Bot 的雙向功能完全用不到
- 業界標準（GitHub、Sentry、Vercel 都用 Webhook 通知 Discord）

### Monorepo 使用 npm workspaces

**決策**: 根目錄 `package.json` 定義 workspaces，三個 apps 各自有 `package.json`。

**理由**:
- 統一 Node.js 版本與工具鏈
- 共用 `tsconfig.base.json`
- GitHub Actions 可針對有變更的 app 分別 build，節省 CI 時間

### 前端框架選 Angular 20 Standalone

**決策**: Angular 20 Standalone + PrimeNG 18 + Tailwind CSS。

**理由**: 符合團隊現有技術棧，Signal-based 響應式更直觀，PrimeNG 提供完整企業元件。

## Risks / Trade-offs

- **[Risk] CheckMacValue/TradeSha 驗證在測試環境繞過** → 開發期間加 `SKIP_SIGNATURE_VERIFY=true` env flag，正式環境強制驗證
- **[Risk] Angular 專案需要 `ng new` CLI 初始化才能運作** → 提供 `angular.json`、`main.ts`、`index.html` 補全步驟
- **[Risk] Railway 免費方案有 sleep 機制** → 升級付費方案或使用 health check ping 保持 alive
- **[Risk] Discord Webhook 有 Rate Limit（30 req/min）** → 大量交易時加入佇列或批次發送（MVP 不處理）
- **[Risk] ECPay/NewebPay 測試帳號申請需時** → 提供 mock callback 測試流程，不依賴真實閘道做開發測試

## Migration Plan

1. **本機開發**: `npm install` → `prisma migrate dev` → `npm run dev:api` → `ng serve`
2. **正式部署**:
   - Railway: 連結 GitHub → 自動偵測 Node.js → 設定 env vars → `prisma migrate deploy && node dist/main.js`
   - Vercel: `vercel --cwd apps/payment-page` + `vercel --cwd apps/admin`
3. **Rollback**: Railway 支援一鍵回滾到上一個 deployment；Vercel 同樣支援

## Open Questions

- ECPay 與 NewebPay 是否需要申請正式帳號，或測試帳號就足夠？
- 後台管理是否需要登入機制（目前設計為 API Key only）？
- 是否需要支援多語系（i18n）？
