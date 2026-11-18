import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { handleCronDailyOps, handleCronLinkChecker, handleCronMonthlyReport, handleCronNewsletter, handleCronSubmissionSitesCheck, handleCronDomainRating } from '../utils/cron'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async ({ controller, env }) => {
    switch (controller.cron) {
      case '0 9 * * *': await handleCronDailyOps(env); break
      // 三个每日批量巡检合并到一个 trigger（Workers Free 最多 5 个）。
      // 各自隔离错误，避免一个失败导致后续任务不执行。
      case '0 3 * * *':
        for (const [label, task] of [
          ['link-checker', handleCronLinkChecker],
          ['submission-sites-check', handleCronSubmissionSitesCheck],
          ['domain-rating', handleCronDomainRating],
        ] as const) {
          try {
            await task(env)
          } catch (e) {
            console.error(`[cron] ${label} failed:`, e)
          }
        }
        break
      case '0 8 1 * *': await handleCronMonthlyReport(env); break
      case '0 14 * * 1': await handleCronNewsletter(env); break
    }
  })
})
