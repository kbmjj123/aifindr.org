import type { H3Event } from 'h3'

export interface CloudflareEnv {
  DB: D1Database
  CACHE: KVNamespace
  TURNSTILE_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  JWT_SECRET: string
  ADMIN_GITHUB_IDS: string
  RESEND_API_KEY: string
  GITHUB_WEBHOOK_SECRET: string
  LEMONSQUEEZY_WEBHOOK_SECRET: string
  SITE_URL: string
  API_BASE: string
}

export function getEnv(event: H3Event): CloudflareEnv {
  return event.context.cloudflare.env as CloudflareEnv
}

/** Build an absolute URL for the site. */
export function siteUrl(env: CloudflareEnv, path = '') {
  const base = env.SITE_URL || env.API_BASE || 'https://aifindr.org'
  return path ? `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}` : base
}
