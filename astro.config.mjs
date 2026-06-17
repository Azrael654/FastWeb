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
    sitemap({
      filter: (page) => {
        return !(
          page.includes('/admin') ||
          page.includes('/dashboard') ||
          page.includes('/login') ||
          page.includes('/checkout')
        );
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});