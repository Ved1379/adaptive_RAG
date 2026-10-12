import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/chat': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
      },
      '/documents': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
