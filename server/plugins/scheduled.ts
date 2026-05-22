import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { handleCronDailyOps, handleCronLinkChecker, handleCronMonthlyReport, handleCronNewsletter } from '../utils/cron'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async ({ controller, env }) => {
    switch (controller.cron) {
      case '0 9 * * *':   await handleCronDailyOps(env);      break
      case '0 3 * * *':   await handleCronLinkChecker(env);   break
      case '0 8 1 * *':   await handleCronMonthlyReport(env); break
      case '0 14 * * 1':  await handleCronNewsletter(env);    break
    }
  })
})
