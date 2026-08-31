import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  site: 'https://edgseu.dev',
  output: 'static',
  trailingSlash: 'always',
  markdown: {
    processor: unified({ gfm: true, smartypants: false }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
  vite: { plugins: [tailwindcss()] },
});
