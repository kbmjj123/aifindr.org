export type ToolPricing = 'free' | 'freemium' | 'paid'
export type ToolStatus = 'active' | 'beta' | 'discontinued' | 'pending'
export type ToolPlatform = 'web' | 'desktop' | 'mobile' | 'api' | 'discord'
export type ToolCategory =
  | 'image' | 'writing' | 'video' | 'audio' | 'code'
  | 'productivity' | 'marketing' | 'data' | 'education'
  | 'business' | 'research' | 'other'

export interface ToolImage {
  url: string
  alt: string
  caption?: string
  type: 'cover' | 'screenshot' | 'logo' | 'banner' | 'og'
  width?: number
  height?: number
}

export interface ToolVideo {
  url: string
  platform: 'youtube' | 'vimeo' | 'twitter' | 'loom' | 'direct'
  video_id?: string
  title?: string
  type: 'demo' | 'tutorial' | 'review' | 'intro'
  thumbnail?: string
  duration?: number
}

export interface Tool {
  id?: number
  slug: string
  name: string
  category: ToolCategory
  website: string
  pricing: ToolPricing
  price_starting?: number
  price_detail?: string
  has_free_trial?: boolean
  platforms: ToolPlatform[]
  tags: string[]
  status: ToolStatus
  launched?: string
  submitted_at: string
  last_verified?: string
  updated_at?: string
  meta_description?: string
  og_image?: string
  cover_image?: string
  featured: boolean
  verified: boolean
  editor_pick: boolean
  click_count?: number
  view_count?: number
  submitter_site?: string
  submitter_github?: string
  images?: ToolImage[]
  videos?: ToolVideo[]
  // Nuxt Content 字段
  body?: unknown
  title?: string
}

export interface ToolListResponse {
  tools: Tool[]
  total: number
  page: number
  pageSize: number
}

export interface SearchResult {
  tools: Tool[]
  query: string
}

export const CATEGORIES: { slug: ToolCategory; name: string; emoji: string }[] = [
  { slug: 'image', name: 'Image & Design', emoji: '🖼️' },
  { slug: 'writing', name: 'Writing & Content', emoji: '✍️' },
  { slug: 'video', name: 'Video & Animation', emoji: '🎬' },
  { slug: 'audio', name: 'Audio & Music', emoji: '🎵' },
  { slug: 'code', name: 'Code & Developer', emoji: '💻' },
  { slug: 'productivity', name: 'Productivity', emoji: '⚡' },
  { slug: 'marketing', name: 'Marketing & SEO', emoji: '📈' },
  { slug: 'data', name: 'Data & Analytics', emoji: '📊' },
  { slug: 'education', name: 'Education & Learning', emoji: '📚' },
  { slug: 'business', name: 'Business & Finance', emoji: '💼' },
  { slug: 'research', name: 'Research & Search', emoji: '🔬' },
  { slug: 'other', name: 'Other', emoji: '···' },
]
