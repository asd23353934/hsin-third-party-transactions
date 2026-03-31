# 專案規範（Claude 工作守則）

## 語言

- 所有回覆、說明、建議一律使用**繁體中文**
- Commit 訊息一律使用**繁體中文**，格式：`類型: 簡短說明`
  - 類型範例：`新增`、`修正`、`重構`、`設定`、`文件`
  - 範例：`修正: 回調處理自動推進 pending→processing 狀態`

## Git 規則

- **不要執行 `git push`**，只提供 commit 訊息建議，由使用者自行 push

## 專案概覽

**Monorepo（npm workspaces）**，三個 app：

| App | 說明 | 部署 |
|-----|------|------|
| `apps/api` | Fastify 4 + TypeScript + Prisma API | Railway → `https://hsinapi-production.up.railway.app` |
| `apps/payment-page` | Angular 20 付款頁面（公開） | Vercel → `https://payment-page-bay.vercel.app` |
| `apps/admin` | Angular 20 後台管理（內部） | Vercel → `https://admin-hsin.vercel.app`（或類似） |

## 付款閘道

- **綠界 ECPay**（唯一支援，NewebPay 已移除）
- 回調端點：`POST /api/callback/ecpay`
- 付款結果 redirect：`POST /api/result/ecpay` → 302 → Vercel `/result`

## API 架構（Clean Architecture）

```
Domain        → Transaction entity、狀態機、Value Objects、Domain Events
Application   → Use Cases、Repository/Notification/Gateway 介面
Infrastructure → Prisma repo、Discord Webhook、ECPay adapter
Presentation  → Fastify routes、middleware
```

## 關鍵設計

- `Result<T,E>` 型別取代 throw/catch（domain 層）
- Callback 先回 `200 OK` 再 async 處理（防止閘道 retry）
- `PaymentCallback` table 儲存所有 raw callback 供稽核
- Discord 通知為 fire-and-forget，錯誤只 log 不 propagate
- `FRONTEND_URL` 環境變數控制 result redirect 目標

## 環境變數（Railway）

重要變數：`ECPAY_MERCHANT_ID`、`ECPAY_HASH_KEY`、`ECPAY_HASH_IV`、`ECPAY_API_URL`、`FRONTEND_URL`

## API Key

前端（Vercel）使用硬編碼 API Key，直接寫在 `environment.prod.ts`（Client-side app，無安全疑慮）
