import { createError, getRouterParams } from 'h3'
import { getEnv } from '~/server/utils/env'

export default defineEventHandler(async (event) => {
  const env = getEnv(event)
  const { id } = getRouterParams(event)

  const numericId = parseInt(id)
  if (isNaN(numericId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tool ID' })
  }

  const result = await env.DB.prepare(
    'UPDATE tools SET click_count = click_count + 1 WHERE id = ?'
  ).bind(numericId).run()

  if (result.meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Tool not found' })
  }

  return { success: true }
})
