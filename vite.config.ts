import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// API key is now server-side only in /api/gemini.ts
// It is NOT defined here — no keys ever reach the browser bundle
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});