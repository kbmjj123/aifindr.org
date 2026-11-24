import type { CloudflareEnv } from './env'
import { logger } from './logger'

const REPO = 'kbmjj123/aifindr.org'
const API_BASE = 'https://api.github.com'

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'aifindr-publish-bot',
    'Content-Type': 'application/json',
  }
}

/**
 * 在 PR 下留言。失败只记日志、不抛出——不影响已入库的工具。
 * token 未配置时静默跳过。需要 Issues: write 权限。
 */
export async function postPrComment(
  env: CloudflareEnv,
  prNumber: number,
  body: string,
): Promise<boolean> {
  const token = env.GITHUB_PR_TOKEN
  if (!token) return false
  try {
    const res = await fetch(`${API_BASE}/repos/${REPO}/issues/${prNumber}/comments`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ body }),
    })
    if (!res.ok) {
      logger.warn('githubPr', 'Failed to post PR comment', { prNumber, status: res.status })
      return false
    }
    logger.info('githubPr', 'PR comment posted', { prNumber })
    return true
  } catch (error) {
    logger.error('githubPr', 'Error posting PR comment', {
      prNumber,
      message: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

/**
 * 以 squash 方式合并 PR。失败只记日志、不抛出——D1 与通知已完成，不回滚。
 * token 未配置时静默跳过。需要 Contents: write 权限且分支保护允许。
 */
export async function mergePr(env: CloudflareEnv, prNumber: number): Promise<boolean> {
  const token = env.GITHUB_PR_TOKEN
  if (!token) return false
  try {
    const res = await fetch(`${API_BASE}/repos/${REPO}/pulls/${prNumber}/merge`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify({
        commit_title: `feat(tools): merge submission #${prNumber}`,
        merge_method: 'squash',
      }),
    })
    if (!res.ok) {
      logger.warn('githubPr', 'Failed to merge PR', { prNumber, status: res.status })
      return false
    }
    logger.info('githubPr', 'PR merged', { prNumber })
    return true
  } catch (error) {
    logger.error('githubPr', 'Error merging PR', {
      prNumber,
      message: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}
