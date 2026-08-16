import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Connect, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { customMouldsPlugin } from './vite-plugin-custom-moulds.js';

function serveCatalogImages(): Plugin {
  const repo = path.resolve(import.meta.dirname, '../../..');
  const publicImages = path.resolve(import.meta.dirname, 'public/images');
  const extracted = path.join(repo, 'import', 'extracted', 'images');
  const bejmatSrc = path.join(repo, 'import', 'products', 'bejmat');
  const bejmatSeed = path.resolve(
    import.meta.dirname,
    '../../Services/Catalog/MTArt.Catalog.Infrastructure/SeedData/bejmat-import.json',
  );
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };

  function bejmatOriginal(webFileName: string): string | null {
    try {
      const payload = JSON.parse(fs.readFileSync(bejmatSeed, 'utf8')) as {
        images?: { webFileName?: string; originalFileName?: string }[];
      };
      const match = payload.images?.find((item) => item.webFileName === webFileName);
      if (!match?.originalFileName) {
        return null;
      }
      return path.join(bejmatSrc, match.originalFileName);
    } catch {
      return null;
    }
  }

  function resolveDiskFile(urlPath: string): string | null {
    const relative = decodeURIComponent(urlPath.split('?')[0] ?? '').replace(/^\/+/, '');

    if (relative.startsWith('import/extracted/images/')) {
      const file = path.join(extracted, relative.slice('import/extracted/images/'.length));
      return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
    }

    const catalog = relative.match(/^images\/catalog\/(?:web\/)?(p\d+)(-thumb)?\.(png|jpe?g|webp)$/i);
    if (catalog) {
      const stem = catalog[1];
      const thumb = Boolean(catalog[2]);
      const candidates = thumb
        ? [
            path.join(publicImages, 'catalog', `${stem}-thumb.webp`),
            path.join(publicImages, 'catalog', `${stem}.webp`),
            path.join(publicImages, 'catalog', `${stem}.png`),
          ]
        : [
            path.join(publicImages, 'catalog', `${stem}.webp`),
            path.join(publicImages, 'catalog', `${stem}.png`),
            path.join(publicImages, 'catalog', `${stem}-i1.jpeg`),
            path.join(extracted, `${stem}-i1.jpeg`),
            path.join(extracted, `${stem}.png`),
          ];
      return candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) ?? null;
    }

    const bjmat = relative.match(/^images\/bjmat\/([^/]+)$/i);
    if (bjmat) {
      const name = bjmat[1];
      const candidates = [path.join(publicImages, 'bjmat', name), bejmatOriginal(name)].filter(Boolean) as string[];
      return candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) ?? null;
    }

    return null;
  }

  function attach(server: ViteDevServer | { middlewares: Connect.Server }) {
    server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
      const url = req.url ?? '';
      if (
        !url.startsWith('/images/catalog/') &&
        !url.startsWith('/images/bjmat/') &&
        !url.startsWith('/import/extracted/images/')
      ) {
        next();
        return;
      }
      const file = resolveDiskFile(url);
      if (!file) {
        next();
        return;
      }
      res.setHeader('Content-Type', types[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      fs.createReadStream(file).pipe(res);
    });
  }

  return {
    name: 'serve-catalog-images',
    configureServer(server) {
      attach(server);
    },
    configurePreviewServer(server) {
      attach(server);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveCatalogImages(), customMouldsPlugin(import.meta.dirname)],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    cors: true,
    fs: {
      allow: [path.resolve(import.meta.dirname, '../../..')],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        bypass(req) {
          if (req.url?.startsWith('/api/v1/custom-moulds')) {
            return req.url;
          }
        },
      },
    },
  },
});
