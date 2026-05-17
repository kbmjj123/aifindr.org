export interface Env {
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
}

export interface JWTPayload {
  sub: number
  gh_id: number
  iat: number
  exp: number
}

export interface UserRecord {
  id: number
  github_id: number
  username: string
  email: string | null
  avatar_url: string | null
  contact_email: string | null
  email_verified: number | null
  email_notify: number | null
  email_verify_token: string | null
  last_login_at: string | null
  unsubscribed_at: string | null
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  sceneId: string
}
