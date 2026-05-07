export default defineNuxtConfig({
  modules: ['@nuxt/content'],

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
  },

  content: {},

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
})
