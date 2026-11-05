import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { API_PROXY_PREFIX, API_PROXY_TARGET, rewriteApiProxyPath } from './src/services/apiRouting.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      [API_PROXY_PREFIX]: {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        rewrite: rewriteApiProxyPath,
      },
    },
  },
});
