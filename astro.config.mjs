import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Mapa slug -> fecha real (updatedDate ?? pubDate) leída del frontmatter del blog,
// para que el sitemap use lastmod por página en vez de la fecha de build global.
const blogDir = fileURLToPath(new URL('./src/content/blog/', import.meta.url));
const blogDates = {};
for (const file of readdirSync(blogDir)) {
  if (!file.endsWith('.md')) continue;
  const fm = readFileSync(blogDir + file, 'utf8').split('---')[1] ?? '';
  const pub = fm.match(/^pubDate:\s*(.+)$/m)?.[1]?.trim();
  const upd = fm.match(/^updatedDate:\s*(.+)$/m)?.[1]?.trim();
  const raw = (upd || pub || '').replace(/^["']|["']$/g, '');
  const date = raw ? new Date(raw) : null;
  if (date && !Number.isNaN(date.getTime())) {
    blogDates[`/blog/${file.replace(/\.md$/, '')}/`] = date;
  }
}

const buildDate = new Date();

// https://astro.build/config
export default defineConfig({
  site: 'https://javicebrian.es',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      // El recurso descargable es noindex (gate): fuera del sitemap.
      filter: (page) => !page.includes('/recursos/checklist-greenwashing/checklist/'),
      serialize(item) {
        const path = new URL(item.url).pathname;
        item.lastmod = (blogDates[path] ?? buildDate).toISOString();
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
