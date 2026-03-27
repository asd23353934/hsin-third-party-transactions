import { getEnv } from '../../shared/config/env.config.js'

export function getDiscordConfig() {
  const env = getEnv()
  return {
    webhookUrlSuccess: env.DISCORD_WEBHOOK_URL_SUCCESS,
    webhookUrlFailed:  env.DISCORD_WEBHOOK_URL_FAILED,
  }
}
