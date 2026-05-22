/**
 * Cloudflare Workers Cron Trigger handler.
 *
 * The nitro cloudflare-module preset auto-detects this plugin and wires
 * the `scheduled` export. If this doesn't work automatically, ensure
 * nuxt.config.ts has nitro.preset set to 'cloudflare-module' (not 'cloudflare-pages').
 *
 * Workers/ files kept as fallback — see workers/api.ts for the original.
 */
import { handleCronDailyOps, handleCronLinkChecker, handleCronMonthlyReport, handleCronNewsletter } from '../utils/cron'
import type { CloudflareEnv } from '../utils/env'

interface ScheduledController {
  cron: string
  scheduledTime: number
  noRetry: () => void
}

export default {
  async scheduled(controller: ScheduledController, env: CloudflareEnv): Promise<void> {
    switch (controller.cron) {
      case '0 9 * * *':   await handleCronDailyOps(env);      break
      case '0 3 * * *':   await handleCronLinkChecker(env);   break
      case '0 8 1 * *':   await handleCronMonthlyReport(env); break
      case '0 14 * * 1':  await handleCronNewsletter(env);    break
    }
  },
}
