export interface Subcategory {
  id: string
  title: string
  keywords: string[]
}

export interface Category {
  id: string
  slug: string
  icon: string
  title: string
  description: string
  hero: string
  sort_order: number
  subcategories: Subcategory[]
}

export interface CategoryRow {
  id: string
  slug: string
  icon: string
  title: string
  description: string
  hero: string
  sort_order: number
  subcategories: string  // JSON string from D1
}