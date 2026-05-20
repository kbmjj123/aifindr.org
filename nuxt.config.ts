const isDev = process.env.NODE_ENV === 'development'
const apiTarget = process.env.API_TARGET || 'http://localhost:8787'

export default defineNuxtConfig({
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    },
    server: {
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
  },
  modules: ['@nuxt/content', '@nuxtjs/seo'],

  site: {
    url: 'https://aifindr.org',
    name: 'aifindr.org – Discover AI Tools',
  },

  css: ['~/assets/css/main.css', '~/assets/css/markdown.css'],

  compatibilityDate: '2026-05-07',

  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  routeRules: {
    '/': { prerender: true },
    '/tools': { prerender: true },
    '/tools/*': { prerender: true },
    '/tools/*/*': isDev ? { prerender: true } : { swr: 86400 },
    '/blog/*/*': isDev ? { prerender: true } : { swr: 604800 },
    '/submit': { prerender: true },
    '/api/**': { cors: true },
  },

  nitro: {
    preset: 'cloudflare-pages',
    devProxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },

  content: {},

  ogImage: {
    enabled: false,
  },

  robots: {
    allow: ['/'],
    disallow: ['/api/'],
  },

  sitemap: {
    sources: [
      isDev
        ? 'http://localhost:8787/__sitemap__/urls'
        : '/api/__sitemap__/urls'
    ],
    autoLastmod: true,
  },

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
})
