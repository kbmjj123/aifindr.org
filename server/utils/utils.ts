/** Verify a Cloudflare Turnstile token. */
export async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: JSON.stringify({ secret, response: token }),
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await res.json() as { success: boolean }
  return data.success
}

/** Generate a URL-friendly slug from a text string. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}
