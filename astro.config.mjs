import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://fast-print.id',

  output: 'server',

  adapter: node({
    mode: 'standalone',
  }),

  security: {
    checkOrigin: false,
  },

  integrations: [
    react(),
    sitemap(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});