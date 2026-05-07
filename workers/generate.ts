/**
 * Generate Worker — AI article generation (post-MVP)
 * Uses Anthropic API to generate tool descriptions and blog posts
 */

interface Env {
  ANTHROPIC_API_KEY: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // TODO: Implement in v1.2+
    return new Response(JSON.stringify({ error: 'Not implemented yet' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  },
}
