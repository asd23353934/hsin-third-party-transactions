# Proposal: 第三方交易系統

## Why

目前專案缺乏一套完整的第三方付款整合機制，無法讓使用者透過標準化界面完成付款流程，也無法讓後台人員即時掌握交易狀態。需建立一套支援 ECPay / NewebPay 雙閘道、具備 Discord 即時通知、且可部署至雲端的交易管理系統。

## What Changes

- **新增** 付款頁面 (Angular)：使用者填寫金額、說明、選擇閘道後提交，自動跳轉至第三方付款頁面
- **新增** 交易後台管理 (Angular)：列表查詢、篩選、詳情檢視
- **新增** 交易 API (Fastify)：建立交易、查詢列表、查詢詳情、接收付款回調
- **新增** ECPay 整合：建立付款表單、驗證回調簽章
- **新增** NewebPay 整合：AES 加密建立付款表單、TradeSha 驗證
- **新增** Discord Webhook 通知：交易成功通知至 `#payment-success`，失敗通知至 `#payment-alerts`
- **新增** 交易狀態機：`pending → processing → success/failed/timeout`，保障狀態轉換合法性
- **新增** 資料庫 Schema：`Transaction` 表、`PaymentCallback` 稽核表 (Prisma + PostgreSQL)
- **新增** 部署設定：API 部署至 Railway，前端部署至 Vercel，GitHub Actions CI/CD 自動化

## Non-Goals

（保留至 design.md）

## Capabilities

### New Capabilities

- `transaction-lifecycle`: 交易建立、狀態流轉、回調處理的完整生命週期管理（Domain 層狀態機 + Application Use Cases）
- `payment-gateway-integration`: ECPay 與 NewebPay 付款表單建立、簽章驗證、回調解析
- `discord-notification`: 交易成功/失敗時透過 Discord Webhook 發送富文字 embed 通知
- `payment-page-ui`: 付款頁面前端，讓使用者完成付款操作並查看結果
- `admin-dashboard-ui`: 後台管理前端，供內部人員查詢與監控交易紀錄
- `deployment-setup`: Railway (API + DB) + Vercel (前端) 部署設定與 GitHub Actions CI/CD 流程

### Modified Capabilities

（無，此為全新專案）

## Impact

- **新增依賴**: Fastify、Prisma、Zod、Angular 20、PrimeNG 18、Tailwind CSS
- **資料庫**: 新增 `transactions`、`payment_callbacks` 兩張表
- **外部服務**: ECPay 測試/正式 API、NewebPay 測試/正式 API、Discord Webhook
- **部署環境**: Railway（Node.js service + PostgreSQL plugin）、Vercel（靜態 SPA）
- **環境變數**: 需設定 13 個 env vars（DB、Discord、ECPay、NewebPay、Auth）
