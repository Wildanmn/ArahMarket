import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Express owns the HTTP server in development, so there is no Vite
      // WebSocket upgrade endpoint available for the injected client.
      // Disable HMR to prevent repeated "WebSocket closed without opened" errors.
      hmr: false,
      watch: null,
    },
  };
});
