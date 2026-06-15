import { createError } from 'h3'
import type { H3Event } from 'h3'

export interface CloudflareEnv {
  DB: D1Database
  CACHE: KVNamespace
  CDN: R2Bucket
  R2_PUBLIC_URL: string
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
  // 1. CF Workers (production): native binding via event.context
  if (event.context.cloudflare?.env) {
    return event.context.cloudflare.env as CloudflareEnv
  }

  // 2. Local dev (Nitro + wrangler): Nitro emulates bindings via event.req.runtime
  //    Requires preset: 'cloudflare_module' + wrangler installed + wrangler.toml configured
  if (event.req?.runtime?.cloudflare?.env) {
    return event.req.runtime.cloudflare.env as CloudflareEnv
  }

  // 3. Fallback (shouldn't reach here in normal usage)
  throw createError({ statusCode: 500, statusMessage: 'Cloudflare bindings not available' })
}

/** Build an absolute URL for the site. */
export function siteUrl(env: CloudflareEnv, path = '') {
  const base = env.SITE_URL || env.API_BASE || 'https://aifindr.org'
  return path ? `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}` : base
}
