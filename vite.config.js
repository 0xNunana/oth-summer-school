import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills(),
  ],
  root: 'public',
  publicDir: false,
  envDir: '../',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  }
});
