# 第三方交易系統

## 架構概覽

```
hsin-third-party-transactions/
├── apps/
│   ├── api/              # Fastify + TypeScript + Prisma (Clean Architecture)
│   ├── payment-page/     # Angular 20 付款頁面 (公開)
│   └── admin/            # Angular 20 後台管理 (內部)
└── docs/
```

## 技術選擇

| 層面 | 技術 | 說明 |
|---|---|---|
| API 框架 | Fastify 4 + TypeScript | 比 Express 快 2x，原生 TS 支援 |
| 資料庫 ORM | Prisma + PostgreSQL | Type-safe，自動 migration |
| 前端框架 | Angular 20 Standalone | Signal-based 響應式 |
| UI 元件 | PrimeNG 18 + Tailwind CSS | 企業級元件庫 |
| 驗證 | Zod | Runtime 驗證 + TS 型別推斷 |
| Discord 通知 | Fetch API (原生) | 無需額外依賴 |
| API 部署 | Railway | 零設定 Node.js + PostgreSQL |
| 前端部署 | Vercel | Angular SPA 靜態部署 |

## Clean Architecture 層次

```
Domain        → 純業務邏輯、狀態機、Value Objects
Application   → Use Cases、Repository/Notification 介面
Infrastructure → Prisma 實作、Discord Webhook、ECPay/NewebPay 適配器
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
# 填入實際的 Discord Webhook URL、ECPay/NewebPay 金鑰
```

### 3. 初始化資料庫

```bash
cd apps/api
npm run db:migrate
```

### 4. 啟動開發環境

```bash
# API (port 3000)
npm run dev:api

# 付款頁面 (port 4200)
cd apps/payment-page && ng serve

# 後台管理 (port 4201)
cd apps/admin && ng serve --port 4201
```

## Discord 通知設定

在 Discord 頻道設定中建立 Webhook：

1. 進入 Discord 頻道設定 → 整合 → Webhooks
2. 建立兩個 Webhook：
   - `#payment-success` → 填入 `DISCORD_WEBHOOK_URL_SUCCESS`
   - `#payment-alerts`  → 填入 `DISCORD_WEBHOOK_URL_FAILED`

**成功通知範例：**
```
✅ 交易成功
訂單 ORD-1234567890 付款成功
交易 ID  | 金額              | 付款方式
abc123   | 1,000 TWD        | 綠界 ECPay
閘道參考：ECPay-TX-999
```

## API 端點

| 方法 | 路徑 | 說明 | 認證 |
|---|---|---|---|
| `POST` | `/api/transactions` | 建立交易 | X-Api-Key |
| `GET`  | `/api/transactions` | 查詢交易列表 | X-Api-Key |
| `GET`  | `/api/transactions/:id` | 查詢交易詳情 | X-Api-Key |
| `POST` | `/api/callback/:gateway` | 付款回調 (ecpay/newebpay) | 無 |
| `GET`  | `/health` | 健康檢查 | 無 |

## CI / CD (GitHub Actions)

Pipeline 設定在 `.github/workflows/ci.yml`，push 到 `main` 時自動觸發：

| Stage | 說明 |
|---|---|
| `lint` | ESLint 檢查 API 程式碼 |
| `test` | Vitest 單元測試 |
| `build-api / build-payment-page / build-admin` | TypeScript + ng build 編譯 |
| `deploy-api` | Railway CLI 部署 API |

**需要在 GitHub Repository → Settings → Secrets → Actions 新增：**
- `RAILWAY_TOKEN` — 從 Railway Dashboard → Account → API Tokens 取得

## 部署

### API → Railway

1. 在 Railway 建立新專案
2. 連結 **GitHub** 儲存庫（`asd23353934/hsin-third-party-transactions`）→ 選擇 `apps/api` 資料夾
3. 新增 PostgreSQL 外掛
4. 在 Railway 設定所有環境變數（參考 `.env.example`）
5. 推送至 `main` 分支，GitHub Actions 自動部署

### 前端 → Vercel

```bash
# payment-page
vercel --cwd apps/payment-page

# admin
vercel --cwd apps/admin
```

## 交易狀態機

```
PENDING → PROCESSING → SUCCESS → REFUNDED
                    ↘ FAILED
                    ↘ TIMEOUT
PENDING → CANCELLED
```

## Angular 前端初始化 (首次設定)

若需要完整的 Angular CLI 設定：

```bash
# payment-page
cd apps
ng new payment-page --standalone --routing --style=scss --skip-git
cd payment-page
ng add primeng
npm install tailwindcss

# admin
cd ../
ng new admin --standalone --routing --style=scss --skip-git
cd admin
ng add primeng
npm install tailwindcss
```

然後將 `src/` 下的元件檔案複製進去即可。
