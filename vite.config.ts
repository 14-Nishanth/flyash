import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets load correctly on GitHub Pages (https://14-nishanth.github.io/flyash/)
  server: {
    port: 3000,
    open: true
  }
});
