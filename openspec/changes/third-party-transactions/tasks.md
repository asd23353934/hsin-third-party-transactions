## 1. 環境準備 (Environment Setup)

- [ ] 1.1 確認 Node.js >= 22、npm >= 10、Angular CLI 已安裝 (`node --version`, `ng version`)
- [ ] 1.2 決定本機資料庫方案：本機 PostgreSQL / Docker PostgreSQL / Railway 雲端 DB
- [ ] 1.3 複製 `.env.example` 為 `apps/api/.env`，填入 DATABASE_URL、API_SECRET_KEY、Discord Webhook URLs、ECPay/NewebPay 測試金鑰
- [ ] 1.4 在 Discord 建立兩個 Webhook（#payment-success 和 #payment-alerts），取得 URL 填入 `.env`

## 2. API 建置 (API Setup — 使用 Clean Architecture 分層 + Monorepo npm workspaces)

- [ ] 2.1 在根目錄執行 `npm install`（Monorepo 使用 npm workspaces，一次安裝三個 apps 的依賴）
- [ ] 2.2 執行 `npx prisma generate` 生成 Prisma Client
- [ ] 2.3 執行 `npx prisma migrate dev --name init` 建立 Transaction entity 及 PaymentCallback 資料表
- [ ] 2.4 執行 `npm run dev` 啟動 API，確認終端出現 `🚀 Spectra API listening on port 3000`
- [ ] 2.5 驗證 API health check 端點：`curl http://localhost:3000/health` 回傳 `{ "status": "ok" }`

## 3. 核心邏輯驗證 (Core Logic Verification)

- [ ] 3.1 驗證 create transaction use case：`POST /api/transactions` 建立交易，確認 transaction entity enforces state machine 初始狀態為 `pending`，回傳包含 `paymentForm` HTML
- [ ] 3.2 驗證 duplicate orderRef is rejected：相同 `orderRef` 發送兩次，第二次應回 `409 Conflict`（Clean Architecture 分層確保 DuplicateOrderRefError 從 domain 層正確傳遞至 presentation 層）
- [ ] 3.3 確認 raw callback is always persisted：呼叫 `POST /api/callback/ecpay`，查 `payment_callbacks` 表確認有記錄
- [ ] 3.4 驗證 handle payment callback use case（callback 先回 200 再非同步處理）：模擬 ECPay 成功回調（RtnCode=1），確認交易狀態從 `pending` 變 `success`，且 endpoint 立即回傳 `200 OK`
- [ ] 3.5 模擬失敗回調（RtnCode=2），確認交易狀態從 `pending`/`processing` 變 `failed`
- [ ] 3.6 驗證 invalid state transition is rejected：對已 `success` 的交易再次送成功回調，應回 `422 Unprocessable Entity`
- [ ] 3.7 測試 list and detail query use cases：`GET /api/transactions`、`GET /api/transactions/:id` 回傳正確資料與分頁
- [ ] 3.8 測試 get detail for non-existent transaction：未知 id 應回 `404 Not Found`

## 4. Discord 通知驗證 (Discord Notification Verification)

- [ ] 4.1 先直接 `curl` Discord Webhook URL 確認 webhook 能用（送測試訊息到 #payment-success）
- [ ] 4.2 觸發成功回調，確認 #payment-success 頻道收到綠色 embed（success notification sent to success webhook）
- [ ] 4.3 觸發失敗回調，確認 #payment-alerts 頻道收到紅色 embed（failure notification sent to failure webhook）
- [ ] 4.4 驗證 Discord errors do not block main flow：將 Webhook URL 改成無效 URL，確認 callback 端點仍回 `200 OK`，不受影響
- [ ] 4.5 確認 notification is fire-and-forget（Discord 使用 Webhook 而非 Bot）：Discord 呼叫不 await，不阻塞 callback response；使用 `.catch()` 吸收錯誤

## 5. 付款閘道整合 (Payment Gateway Integration)

- [ ] 5.1 確認 gateway factory resolves adapters by name：呼叫 `buildGatewayMap().get('ecpay')` 回傳 EcpayAdapter，`get('unknown')` 回傳 undefined
- [ ] 5.2 使用 ECPay 測試帳號，實際送出付款表單到 ECPay staging 環境，確認 ECPay payment form generation 正常跳轉
- [ ] 5.3 在 ECPay 測試環境完成付款，確認 ECPay callback verification（CheckMacValue 驗證通過）
- [ ] 5.4 (可選) 測試 NewebPay payment form generation，確認 TradeInfo AES 加密與 TradeSha 正確
- [ ] 5.5 (可選) 測試 NewebPay callback verification，確認 TradeSha 驗證與 TradeInfo 解密正常

## 6. 前端建置 — 付款頁面 (Payment Page Setup)

- [ ] 6.1 在 `apps/payment-page` 執行 `ng new` 或補齊 `angular.json`、`main.ts`、`index.html`（參考 README）
- [ ] 6.2 執行 `npm install` 安裝 Angular、PrimeNG、Tailwind CSS 依賴
- [ ] 6.3 執行 `ng serve`，確認 `http://localhost:4200` 顯示付款表單
- [ ] 6.4 驗證 payment form allows amount, description, and gateway selection：填寫表單後「前往付款」按鈕啟用
- [ ] 6.5 驗證 submit button is disabled when required fields are empty：清空金額或說明，確認按鈕變灰
- [ ] 6.6 測試 payment form submission calls the API and redirects：完整流程測試，確認成功跳轉閘道
- [ ] 6.7 確認 result page shows success or failure state：直接訪問 `/result?RtnCode=1` 顯示成功畫面
- [ ] 6.8 確認 SSL security indicator is visible：頁面下方顯示鎖頭圖示與「SSL 加密保護」文字

## 7. 前端建置 — 後台管理 (Admin Dashboard Setup)

- [ ] 7.1 在 `apps/admin` 執行 `ng new` 或補齊設定檔（`--port 4201`）
- [ ] 7.2 執行 `npm install`，執行 `ng serve --port 4201`，確認 `http://localhost:4201` 正常顯示
- [ ] 7.3 確認 transaction list with pagination and filters 顯示交易列表，測試狀態與閘道篩選
- [ ] 7.4 確認 transaction status is displayed with colored badge（success=綠，failed=紅）
- [ ] 7.5 點擊詳情連結，確認 transaction detail page shows all fields 正確顯示所有欄位
- [ ] 7.6 確認 API key is injected automatically in all requests（前端框架選 Angular 20 Standalone + auth interceptor）：打開瀏覽器 Network tab，確認所有 API 請求帶有 `X-Api-Key` header
- [ ] 7.7 確認 signal-based state management：切換篩選時 loading spinner 正常出現與消失

## 8. 部署 — API to Railway (API Deployment)

- [ ] 8.1 安裝 Railway CLI：`npm install -g @railway/cli`，執行 `railway login`
- [ ] 8.2 在 Railway Dashboard 建立新專案，連結 **GitHub** 儲存庫（`asd23353934/hsin-third-party-transactions`）
- [ ] 8.3 新增 PostgreSQL plugin，取得 `DATABASE_URL`
- [ ] 8.4 在 Railway 環境變數設定所有 `.env.example` 中的值（all sensitive values are stored as environment variables）
- [ ] 8.5 確認 `apps/api/railway.json` 的 build/start command 正確（API is deployable to Railway）
- [ ] 8.6 推送至 `main` 分支觸發部署，確認 database migrations run automatically on deploy
- [ ] 8.7 訪問 Railway 提供的 URL + `/health`，確認 API health check responds to Railway probes

## 9. 部署 — 前端到 Vercel (Frontend Deployment)

- [ ] 9.1 安裝 Vercel CLI：`npm install -g vercel`，執行 `vercel login`
- [ ] 9.2 在 `apps/payment-page/src/environments/environment.prod.ts` 更新 `apiUrl` 為 Railway URL
- [ ] 9.3 在 `apps/admin/src/environments/environment.prod.ts` 更新 `apiUrl` 為 Railway URL
- [ ] 9.4 執行 `vercel --cwd apps/payment-page --prod`，確認 frontend apps are deployable to Vercel
- [ ] 9.5 執行 `vercel --cwd apps/admin --prod`
- [ ] 9.6 確認 SPA routing is handled by rewrites：直接訪問 `https://<domain>/result` 不出現 404
- [ ] 9.7 在正式環境完整測試一筆付款流程，確認 Discord 通知正常送達

## 10. CI/CD 驗證 (CI/CD Verification)

- [ ] 10.1 確認 `.github/workflows/ci.yml` 存在且 GitHub Actions runs lint, test, and build on main branch；並在 GitHub Repo → Settings → Secrets → Actions 新增 `RAILWAY_TOKEN`
- [ ] 10.2 推送一個 commit 至 `main`，確認 pipeline 成功跑完 lint → test → build 三個 stage
- [ ] 10.3 確認 build artifacts are passed to deploy stage（GitHub Actions `upload-artifact` / `download-artifact` 設定正確）
- [ ] 10.4 確認 `.gitignore` excludes .env files（執行 `git status` 不應看到 `.env` 出現在 untracked files）
