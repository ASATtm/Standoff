// vite.config.js (exact, clear fix)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, 
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', 
        changeOrigin: true,
        rewrite: (path) => path, 
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[VITE] 🔁 ${req.method} ${req.url}`);
          });
        },
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        unityGame: resolve(__dirname, 'public/games2/fps/web-fps-build-2/index.html'),
      },
    },
  },
});
