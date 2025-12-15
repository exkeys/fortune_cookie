import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const base = process.env.BASE_PATH || '/'
const isPreview = process.env.IS_PREVIEW  ? true : false;
// https://vite.dev/config/
export default defineConfig({
  define: {
   __BASE_PATH__: JSON.stringify(base),
   __IS_PREVIEW__: JSON.stringify(isPreview)
  },
  plugins: [react()],
  base,
  build: {
    sourcemap: true,
    outDir: 'out',
    // 코드 스플리팅: lazy loading으로 자동 청크 분리
    // 청크 크기 경고 임계값 (대규모 앱 대비)
    chunkSizeWarningLimit: 1000,
    // 프로덕션 빌드 시 console.log, debugger 제거
    minify: 'esbuild',
  },
  esbuild: {
    // 프로덕션 빌드 시 console과 debugger 제거
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': process.env.VITE_API_BASE_URL || 'http://localhost:4000',
    },
  }
})
