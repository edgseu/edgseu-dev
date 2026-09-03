import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import { visit } from 'unist-util-visit';
import { site } from './src/data/site';

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
}

function rehypeArticleEnhancements() {
  return (tree: HastNode) => {
    visit(tree, 'element', (node: HastNode, index: number | undefined, parent: HastNode | undefined) => {
      if (!parent || typeof index !== 'number' || !parent.children) return;
      if (node.tagName === 'pre') {
        const lang = node.properties?.dataLanguage || node.properties?.['data-language'] || 'code';
        const wrapper: HastNode = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['code-block'] },
          children: [
            {
              type: 'element',
              tagName: 'div',
              properties: { className: ['code-block-header'] },
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { className: ['code-block-title'] },
                  children: [{ type: 'text', value: String(lang) }],
                },
                {
                  type: 'element',
                  tagName: 'button',
                  properties: {
                    type: 'button',
                    className: ['copy-code'],
                    'aria-label': 'Copy code to clipboard',
                  },
                  children: [
                    {
                      type: 'element',
                      tagName: 'svg',
                      properties: {
                        xmlns: 'http://www.w3.org/2000/svg',
                        viewBox: '0 0 448 512',
                        width: '13px',
                        height: '13px',
                        fill: 'currentColor',
                        'aria-hidden': 'true',
                        focusable: 'false',
                      },
                      children: [
                        {
                          type: 'element',
                          tagName: 'path',
                          properties: {
                            d: 'M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L384 95.9 384 320c0 8.8-7.2 16-16 16zM192 0C165.5 0 144 21.5 144 48l0 272c0 26.5 21.5 48 48 48l192 0c26.5 0 48-21.5 48-48l0-224c0-12.7-5.1-24.9-14.1-33.9L385.9 14.1C376.9 5.1 364.7 0 352 0L192 0zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z',
                          },
                          children: [],
                        },
                      ],
                    },
                    { type: 'text', value: ' ' },
                    {
                      type: 'element',
                      tagName: 'span',
                      properties: {},
                      children: [{ type: 'text', value: 'Copy' }],
                    },
                  ],
                },
              ],
            },
            node,
          ],
        };
        parent.children[index] = wrapper;
      } else if (node.tagName === 'table') {
        const wrapper: HastNode = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['table-scroll'],
            tabIndex: 0,
            role: 'region',
            ariaLabel: 'Scrollable table',
          },
          children: [node],
        };
        parent.children[index] = wrapper;
      }
    });
  };
}

export default defineConfig({
  site: site.canonicalUrl,
  output: 'static',
  trailingSlash: 'always',
  markdown: {
    processor: unified({
      gfm: true,
      smartypants: false,
      rehypePlugins: [rehypeArticleEnhancements],
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
  vite: { plugins: [tailwindcss()] },
});
