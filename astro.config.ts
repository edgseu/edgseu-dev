import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import { site } from './src/data/site';

export default defineConfig({
  site: site.canonicalUrl,
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
