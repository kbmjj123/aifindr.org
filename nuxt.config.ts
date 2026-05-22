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

  nitro: {
    preset: 'cloudflare_module',
    devProxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
		cloudflare: {
			nodeCompat: true,
		}
  },
	runtimeConfig: {
		apiBase: '',  // 服务端用，本地开发由 .env.local 注入
	},

  content: {},

  ogImage: {
    enabled: true,
		// 告诉模块当前是边缘运行时，用 wasm 版本
		runtimeCacheStorage: false
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
