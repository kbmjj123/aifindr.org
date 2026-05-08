export default defineNuxtConfig({
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
    '/tools/*/': { prerender: true },
    '/submit': { prerender: true },
    '/tools/*/*': { isr: 86400 },
    '/blog/*/*': { isr: 604800 },
    '/api/**': { cors: true },
  },

  nitro: {
    preset: process.env.NODE_ENV === 'production' ? 'cloudflare-pages' : undefined,
    devProxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
    },
  },

  content: {},

  ogImage: {
    zeroRuntime: true,
  },

  robots: {
    allow: ['/'],
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
})
