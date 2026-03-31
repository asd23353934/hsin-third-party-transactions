# 第三方交易系統

綠界 ECPay 金流整合系統，含付款頁面、後台管理與 Discord 通知。

## 架構概覽

```
hsin-third-party-transactions/
├── apps/
│   ├── api/            # Fastify + TypeScript + Prisma (Clean Architecture)
│   ├── payment-page/   # Angular 20 付款頁面（公開）
│   └── admin/          # Angular 20 後台管理（內部）
├── .env.example
└── package.json        # npm workspaces 根設定
```

## 技術選擇

| 層面 | 技術 | 說明 |
|------|------|------|
| API 框架 | Fastify 4 + TypeScript | 高效能，原生 TS 支援 |
| 資料庫 ORM | Prisma + PostgreSQL | Type-safe，自動 migration |
| 前端框架 | Angular 20 Standalone | Signal-based 響應式狀態管理 |
| UI 元件 | PrimeNG 18 + Tailwind CSS | 企業級元件庫 |
| 驗證 | Zod | Runtime 驗證 + TS 型別推斷 |
| 付款閘道 | 綠界 ECPay | 台灣主流金流 |
| Discord 通知 | Fetch API（原生） | 無需額外依賴 |
| API 部署 | Railway | 零設定 Node.js + PostgreSQL |
| 前端部署 | Vercel | Angular SPA 靜態部署 |

## Clean Architecture 層次

```
Domain        → 純業務邏輯、狀態機、Value Objects
Application   → Use Cases、Repository / Notification / Gateway 介面
Infrastructure → Prisma 實作、Discord Webhook、ECPay Adapter
Presentation  → Fastify Routes、Request 驗證、Response 格式化
```

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

```bash
cp .env.example apps/api/.env
# 填入 DATABASE_URL、API_SECRET_KEY、Discord Webhook URLs、ECPay 金鑰
```

### 3. 初始化資料庫

```bash
cd apps/api
npm run db:migrate
```

### 4. 啟動開發環境

```bash
# API（port 3000）
npm run dev:api

# 付款頁面（port 4200）
cd apps/payment-page && ng serve

# 後台管理（port 4201）
cd apps/admin && ng serve --port 4201
```

## API 端點

| 方法 | 路徑 | 說明 | 認證 |
|------|------|------|------|
| `POST` | `/api/transactions` | 建立交易，回傳 ECPay 付款表單 HTML | X-Api-Key |
| `GET`  | `/api/transactions` | 查詢交易列表（支援分頁、狀態/閘道篩選） | X-Api-Key |
| `GET`  | `/api/transactions/:id` | 查詢交易詳情 | X-Api-Key |
| `POST` | `/api/callback/ecpay` | ECPay server-side 回調（先回 200，async 處理） | 無 |
| `POST` | `/api/result/ecpay` | ECPay 付款完成 browser redirect 中繼（302 → 前端） | 無 |
| `GET`  | `/health` | 健康檢查 | 無 |

## 交易狀態機

```
PENDING → PROCESSING → SUCCESS → REFUNDED
                    ↘ FAILED
                    ↘ TIMEOUT
PENDING → CANCELLED
```

## Discord 通知設定

1. 進入 Discord 頻道設定 → 整合 → Webhooks
2. 建立兩個 Webhook：
   - `#payment-success` → 填入 `DISCORD_WEBHOOK_URL_SUCCESS`
   - `#payment-alerts`  → 填入 `DISCORD_WEBHOOK_URL_FAILED`

## 部署

### API → Railway

1. Railway Dashboard → 新建專案 → 連結 GitHub repository
2. 新增 PostgreSQL plugin
3. 設定環境變數（參考 `.env.example`，加上 `FRONTEND_URL`）
4. Push 至 `master` 分支自動部署

重要環境變數：

```
ECPAY_MERCHANT_ID=（你的特店編號）
ECPAY_HASH_KEY=（你的 HashKey）
ECPAY_HASH_IV=（你的 HashIV）
ECPAY_API_URL=https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5
FRONTEND_URL=https://payment-page-bay.vercel.app
```

### 前端 → Vercel

```bash
# 付款頁面
vercel --cwd apps/payment-page --prod

# 後台管理
vercel --cwd apps/admin --prod
```

Vercel Dashboard 需設定：
- **Build Command**：`npm run build --workspace=apps/payment-page`
- **Output Directory**：`apps/payment-page/dist/payment-page/browser`
- **Root Directory**：（留空）

## ECPay 後台設定

在 [ECPay 廠商後台](https://vendor.ecpay.com.tw) → 系統設定 → 通知設定：

| 設定 | 值 |
|------|-----|
| 付款完成通知網址（ReturnURL） | `https://<railway-api>/api/callback/ecpay` |

`OrderResultURL` 由程式碼動態傳入，不需在後台設定。

## CI/CD（GitHub Actions）

Pipeline 設定在 `.github/workflows/ci.yml`，push 至 `master` 時自動觸發：

| Stage | 說明 |
|-------|------|
| `lint` | ESLint 檢查 API 程式碼 |
| `test` | Vitest 單元測試 |
| `build-api / build-payment-page / build-admin` | TypeScript + ng build 編譯 |
