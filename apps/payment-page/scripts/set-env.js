// 在 Vercel 建置前，將環境變數注入 Angular environment.prod.ts
const { writeFileSync } = require('fs')
const { resolve } = require('path')

const apiKey  = process.env['API_KEY']  || ''
const apiUrl  = process.env['API_URL']  || 'https://hsinapi-production.up.railway.app'
const baseUrl = process.env['BASE_URL'] || 'https://payment-page-bay.vercel.app'

const content = `export const environment = {
  production: true,
  apiUrl:    '${apiUrl}',
  baseUrl:   '${baseUrl}',
  apiKey:    '${apiKey}',
}
`

const outPath = resolve(__dirname, '../src/environments/environment.prod.ts')
writeFileSync(outPath, content, 'utf-8')
console.log('✅ environment.prod.ts 已產生 (apiUrl=' + apiUrl + ')')
