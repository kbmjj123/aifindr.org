import type { MaybeRefOrGetter } from 'vue'

const SITE_NAME = 'aifindr.org'
const TAGLINE = 'Discover 500+ AI Tools, Free & Open Source'
const DESC_SEPARATOR = ' — '
const TITLE_SEPARATOR = ' | '

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

function formatDescription(text: string, max = 158): string {
  return truncate(text.replace(/\s+/g, ' ').trim(), max)
}

interface PageSeoOptions {
  /** 页面唯一标题（不含站点后缀），首页留空则使用默认 */
  title?: string
  /** 页面描述，默认使用站点描述 */
  description?: string
  /** 描述字数上限 */
  descMax?: number
  /** SEO title 格式模板 */
  template?: 'default' | 'category' | 'tool' | 'blog' | 'prefix'
  /** 模板变量：分类名 */
  category?: string
  /** 模板变量：子标题（详情页一行描述等） */
  subtitle?: string
}

function buildTitle(opts: PageSeoOptions): string {
  const t = opts.title || TAGLINE
  switch (opts.template) {
    case 'category':
      return `Best ${opts.category || t} AI Tools in 2026${TITLE_SEPARATOR}${SITE_NAME}`
    case 'tool':
      return `${t}${DESC_SEPARATOR}${opts.subtitle || ''}${TITLE_SEPARATOR}${SITE_NAME}`
    case 'blog':
      return `${t}${TITLE_SEPARATOR}${SITE_NAME} Blog`
    case 'prefix':
      return `${t}${TITLE_SEPARATOR}${SITE_NAME}`
    default:
      return `${SITE_NAME}${DESC_SEPARATOR}${TAGLINE}`
  }
}

function buildDescription(opts: PageSeoOptions): string {
  return formatDescription(
    opts.description || TAGLINE,
    opts.descMax ?? 158,
  )
}

const OG_TYPE_LABEL: Record<string, string> = {
  default: 'Home',
  category: 'Category',
  tool: 'AI Tool',
  blog: 'Blog',
  prefix: 'Page',
}

/**
 * 标准 SEO + OG Image 配置 composable
 *
 * 自动设置 page title、meta description、Open Graph / Twitter meta，
 * 以及调用 defineOgImage 渲染自定义 OG 图片组件。
 *
 * 支持传入普通值或 Ref/Getter（通过 toValue 解包）。
 */
export function usePageSeo(opts: MaybeRefOrGetter<PageSeoOptions>) {
  const resolved = computed(() => {
    const o = toValue(opts)
    return {
      title: buildTitle(o),
      description: buildDescription(o),
      ogTitle: o.title || TAGLINE,
      ogDescription: o.description || TAGLINE,
      ogType: OG_TYPE_LABEL[o.template || 'default'] || 'Page',
    }
  })

  useHead({
    title: computed(() => resolved.value.title),
    meta: computed(() => [
      { name: 'description', content: resolved.value.description },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: resolved.value.title },
      { name: 'twitter:description', content: resolved.value.description },
      { property: 'og:title', content: resolved.value.title },
      { property: 'og:description', content: resolved.value.description },
    ]),
  })

  defineOgImage('AppOgImage', () => ({
    title: resolved.value.ogTitle,
    description: resolved.value.ogDescription,
    type: resolved.value.ogType,
  }))
}
