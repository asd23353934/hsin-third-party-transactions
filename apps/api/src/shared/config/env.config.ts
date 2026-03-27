import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV:   z.enum(['development', 'production', 'test']).default('development'),
  PORT:       z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),

  ALLOWED_ORIGINS: z.string().default('http://localhost:4200'),
  API_SECRET_KEY:  z.string().min(16),

  DISCORD_WEBHOOK_URL_SUCCESS: z.string().url(),
  DISCORD_WEBHOOK_URL_FAILED:  z.string().url(),

  ECPAY_MERCHANT_ID: z.string(),
  ECPAY_HASH_KEY:    z.string(),
  ECPAY_HASH_IV:     z.string(),
  ECPAY_API_URL:     z.string().url(),

  NEWEBPAY_MERCHANT_ID: z.string(),
  NEWEBPAY_HASH_KEY:    z.string(),
  NEWEBPAY_HASH_IV:     z.string(),
  NEWEBPAY_API_URL:     z.string().url(),
})

export type Env = z.infer<typeof EnvSchema>

let _env: Env | null = null

export function getEnv(): Env {
  if (_env) return _env
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(parsed.error.flatten().fieldErrors)
    process.exit(1)
  }
  _env = parsed.data
  return _env
}
