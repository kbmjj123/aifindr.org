import { getQuery, getRequestURL, getHeader, sendRedirect } from 'h3'
import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const url = getRequestURL(event)
  const redirectUri = `${url.origin}/api/auth/callback`

  const referer = getHeader(event, 'Referer')
  const frontendOrigin = getHeader(event, 'Origin') || (referer ? new URL(referer).origin : url.origin)

  const ghUrl = new URL('https://github.com/login/oauth/authorize')
  ghUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
  ghUrl.searchParams.set('redirect_uri', redirectUri)
  ghUrl.searchParams.set('scope', 'read:user user:email')
  ghUrl.searchParams.set('state', frontendOrigin)

  await sendRedirect(event, ghUrl.toString(), 302)
})
