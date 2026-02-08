import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
  // This maps the Vercel variable to the names your code is looking for
  'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
},
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // --- ADD THIS SECTION BELOW ---
      build: {
        chunkSizeWarningLimit: 1600, // This sets the limit to 1600kB
      }
      // ------------------------------
    };
});
