const isDev = process.env.NODE_ENV === 'development'
export default defineNuxtConfig({
	vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    }
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
    '/tools/*/': { prerender: true },
    '/submit': { prerender: true },
    '/tools/*/*': { isr: 86400 },
    '/blog/*/*': { isr: 604800 },
    '/api/**': { cors: true },
	},

  nitro: {
    preset: 'cloudflare-pages',
    devProxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
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
