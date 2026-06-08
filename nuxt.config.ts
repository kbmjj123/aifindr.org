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
        '/api': {
          target: process.env.API_PROXY_TARGET || 'https://aifindr.org',
          changeOrigin: true,
        }
      }
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

  nitro: {
    preset: process.env.NODE_ENV === 'production' ? 'cloudflare_module' : undefined,
		cloudflare: {
			nodeCompat: true,
		},
    devProxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'https://aifindr.org',
        changeOrigin: true,
      }
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
      '/api/__sitemap__/urls'
    ],
    autoLastmod: true,
  },

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
})
