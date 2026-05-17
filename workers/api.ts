import { CORS, json, error, matchPath } from './lib/response'
import { handleListTools, handleToolDetail, handleSearch, handleStats, handleClick } from './routes/tools'
import { handleSubmit } from './routes/submit'
import { handleAuthRedirect, handleAuthCallback, handleAuthMe, handleDevLogin } from './routes/auth'
import { handleAdminPending, handleAdminReview, handleAdminFeature, handleAdminBroadcast } from './routes/admin'
import { handleUserEmail, handleEmailVerify } from './routes/user'
import { handleGithubWebhook } from './routes/webhooks-github'
import { handleLemonSqueezyWebhook } from './routes/webhooks-ls'
import { handleCronDailyOps, handleCronLinkChecker, handleCronMonthlyReport, handleCronNewsletter } from './routes/cron'
import { handleGenerate } from './routes/generate'
import { handleSitemapUrls } from './routes/seo'
import type { Env } from './types'

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    switch (controller.cron) {
      case '0 9 * * *':   await handleCronDailyOps(env);      break
      case '0 3 * * *':   await handleCronLinkChecker(env);   break
      case '0 8 1 * *':   await handleCronMonthlyReport(env); break
      case '0 14 * * 1':  await handleCronNewsletter(env);     break
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.replace(/^\/api/, '') || '/'
    const method = request.method

    if (method === 'OPTIONS') return new Response(null, { headers: CORS })

    try {
      /* Tools */
      if (method === 'GET' && path === '/tools')        return handleListTools(url, env)
      if (method === 'GET' && path === '/tools/search') return handleSearch(url, env)
      if (method === 'GET' && path === '/stats')        return handleStats(env)
      const detailParams = matchPath(path, '/tools/:category/:slug')
      if (method === 'GET' && detailParams) return handleToolDetail(detailParams.category!, detailParams.slug!, env)
      const clickParams = matchPath(path, '/click/:id')
      if (method === 'POST' && clickParams) return handleClick(clickParams.id!, env)
      if (method === 'POST' && path === '/submit') return handleSubmit(request, env)

      /* Auth */
      if (method === 'GET' && path === '/auth/github')    return handleAuthRedirect(url, request, env)
      if (method === 'GET' && path === '/auth/callback')  return handleAuthCallback(url, request, env)
      if (method === 'GET' && path === '/auth/me')        return handleAuthMe(request, env)
      if (method === 'GET' && path === '/auth/dev-login') return handleDevLogin(env)

      /* Admin */
      if (method === 'GET'  && path === '/admin/pending')   return handleAdminPending(request, env)
      if (method === 'POST' && path === '/admin/review')    return handleAdminReview(request, env)
      if (method === 'POST' && path === '/admin/feature')   return handleAdminFeature(request, env)
      if (method === 'POST' && path === '/admin/broadcast') return handleAdminBroadcast(request, env)

      /* User */
      if (method === 'POST' && path === '/user/email') return handleUserEmail(request, env)
      const verifyParams = matchPath(path, '/user/email/verify/:token')
      if (method === 'GET' && verifyParams) return handleEmailVerify(verifyParams.token!, env)

      /* Webhooks */
      if (method === 'POST' && path === '/webhooks/github')      return handleGithubWebhook(request, env)
      if (method === 'POST' && path === '/webhooks/lemonsqueezy') return handleLemonSqueezyWebhook(request, env)

      /* Generate */
      if (method === 'POST' && path === '/generate') return handleGenerate(request, env)

      /* Sitemap */
      if (method === 'GET' && path === '/__sitemap__/urls') return handleSitemapUrls(env)

      /* Cron (manual trigger for testing) */
      if (method === 'POST' && path === '/cron/daily-ops') {
        await handleCronDailyOps(env)
        return json({ success: true, message: 'Daily ops completed' })
      }
      if (method === 'POST' && path === '/cron/link-checker') {
        const checked = await handleCronLinkChecker(env)
        return json({ success: true, ...checked })
      }
      if (method === 'POST' && path === '/cron/monthly-report') {
        const result = await handleCronMonthlyReport(env)
        return json({ success: true, ...result })
      }
      if (method === 'POST' && path === '/cron/newsletter') {
        const requestBody = await request.json().catch(() => ({})) as Record<string, unknown>
        const result = await handleCronNewsletter(env, String(requestBody.subject || ''), String(requestBody.body || ''))
        return json({ success: true, ...result })
      }

      return error('Not found', 404)
    } catch (err) {
      console.error('Worker error:', err)
      const message = err instanceof Error ? err.message : 'Internal server error'
      return error(message, 500)
    }
  },
}
