import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // 桌面端由 Tauri 直接加载 dist，不需要 Service Worker；PWA 安装提示
  // 在桌面壳里也没有意义，构建时关掉，避免注册失败和缓存旧资源。
  const desktop = mode === 'desktop'

  return {
    // Relative base keeps the build working on GitHub Pages project URLs and
    // when previewing from a subdirectory.
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      ...(desktop
        ? []
        : [
            VitePWA({
              // A training session is short, and a stale service worker would hide
              // fixes/data corrections for days. Auto-update on the next navigation.
              registerType: 'autoUpdate',
              injectRegister: 'auto',
              devOptions: { enabled: false },
              workbox: {
                globPatterns: ['**/*.{js,css,html,json,svg,png,ico,woff2,wav}'],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                cleanupOutdatedCaches: true,
                navigateFallback: 'index.html',
              },
              manifest: {
                name: '脱口 — 工程师工作英语训练',
                short_name: '脱口',
                description: '用真实工作场景练成脱口而出。',
                lang: 'zh-CN',
                theme_color: '#0b0d10',
                background_color: '#0b0d10',
                display: 'standalone',
                orientation: 'portrait',
                start_url: './',
                scope: './',
                icons: [
                  {
                    src: 'icon-192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any',
                  },
                  {
                    src: 'icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any',
                  },
                  {
                    src: 'icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable',
                  },
                  {
                    src: 'icon.svg',
                    sizes: 'any',
                    type: 'image/svg+xml',
                    purpose: 'any',
                  },
                ],
              },
            }),
          ]),
    ],
    server: {
      host: true,
    },
    preview: {
      host: true,
    },
  }
})
