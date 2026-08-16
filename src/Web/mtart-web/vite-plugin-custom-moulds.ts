import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { outlineUploadedSvg, sanitizeSvg } from './src/features/simulator/utils/sanitizeSvg.ts';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_BODY = 15 * 1024 * 1024;
const MAX_AGE_MS = 48 * 60 * 60 * 1000;
const PREFIX = '/api/v1/custom-moulds';

const MAGIC = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
};

type JobStatus = 'queued' | 'processing' | 'ready' | 'failed';

interface Job {
  id: string;
  status: JobStatus;
  step: string;
  reason?: string;
  result?: Record<string, unknown>;
  startedAt: number;
}

const jobs = new Map<string, Job>();

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('too-large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function detectKind(buffer: Buffer, mime: string, textStart: string): 'jpeg' | 'png' | 'webp' | 'svg' | null {
  if (buffer.length >= 3 && MAGIC.jpeg.every((byte, i) => buffer[i] === byte)) {
    return 'jpeg';
  }
  if (buffer.length >= 4 && MAGIC.png.every((byte, i) => buffer[i] === byte)) {
    return 'png';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  const head = textStart.slice(0, 256).trim().toLowerCase();
  if (head.startsWith('<svg') || head.startsWith('<?xml') || mime === 'image/svg+xml') {
    if (head.includes('<svg') || mime === 'image/svg+xml') {
      return 'svg';
    }
  }
  return null;
}

function cleanupCustomDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) {
      continue;
    }
    const target = path.join(dir, name);
    try {
      const stat = fs.statSync(target);
      if (stat.isDirectory() && Date.now() - stat.mtimeMs > MAX_AGE_MS) {
        fs.rmSync(target, { recursive: true, force: true });
      }
    } catch {
      /* ignore */
    }
  }
}

function spawnPython(args: string[], cwd: string, timeoutMs: number): Promise<number> {
  const bin = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('timeout'));
    }, timeoutMs);
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0 || code === 2) {
        resolve(code ?? 1);
        return;
      }
      reject(new Error(stderr.trim() || `python exited ${code}`));
    });
  });
}

function extractSvgRegions(markup: string): Array<{ key: string; name: string }> {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const match of markup.matchAll(/data-region(?:-id)?=["']([^"']+)["']/g)) {
    const key = match[1];
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys.map((key, index) => ({
    key,
    name: key === 'background' ? 'Background' : `Area ${index}`,
  }));
}

function assignRegions(markup: string): string {
  if (/data-region(?:-id)?=/.test(markup)) {
    return markup;
  }
  let index = 0;
  return markup.replace(/<(path|polygon|rect|circle|ellipse)\b/gi, (tag) => {
    index += 1;
    const key = index === 1 ? 'background' : `region-${index - 1}`;
    return `${tag} data-region="${key}" data-region-id="${key}"`;
  });
}

export function customMouldsPlugin(rootDir: string): Plugin {
  const repoRoot = path.resolve(rootDir, '../../..');
  const publicCustom = path.join(rootDir, 'public/moulds/custom');
  const script = path.join(repoRoot, 'tools/vectorize-moulds/process_upload.py');

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = req.url ?? '';
    const pathname = url.split('?')[0] ?? '';
    if (!pathname.startsWith(PREFIX)) {
      return false;
    }

    if (req.method === 'POST' && (pathname === PREFIX || pathname === `${PREFIX}/`)) {
      let body: { imageBase64?: string; mimeType?: string; crop?: { x: number; y: number; w: number; h: number }; quad?: number[][]; alreadyCropped?: boolean };
      try {
        const raw = await readBody(req, MAX_BODY);
        body = JSON.parse(raw.toString('utf8')) as typeof body;
      } catch (error) {
        json(res, error instanceof Error && error.message === 'too-large' ? 413 : 400, { error: 'invalid-body' });
        return true;
      }
      const base64 = (body.imageBase64 ?? '').replace(/^data:[^;]+;base64,/, '');
      if (!base64) {
        json(res, 400, { error: 'missing-image' });
        return true;
      }
      const buffer = Buffer.from(base64, 'base64');
      if (buffer.length > MAX_BYTES) {
        json(res, 400, { error: 'too-large' });
        return true;
      }
      const kind = detectKind(buffer, body.mimeType ?? '', buffer.subarray(0, 512).toString('utf8'));
      if (!kind) {
        json(res, 400, { error: 'bad-type' });
        return true;
      }

      const id = randomBytes(8).toString('hex');
      const dir = path.join(publicCustom, id);
      fs.mkdirSync(dir, { recursive: true });
      const job: Job = { id, status: 'queued', step: 'uploaded', startedAt: Date.now() };
      jobs.set(id, job);

      if (kind === 'svg') {
        const sanitized = outlineUploadedSvg(assignRegions(sanitizeSvg(buffer.toString('utf8'))));
        const regions = extractSvgRegions(sanitized);
        if (regions.length < 2 || !sanitized.includes('<svg')) {
          job.status = 'failed';
          job.step = 'failed';
          job.reason = 'no-closed-regions';
          json(res, 200, { jobId: id, status: job.status });
          return true;
        }
        fs.writeFileSync(path.join(dir, 'mould.svg'), sanitized, 'utf8');
        const result = {
          jobId: id,
          published: true,
          status: 'ready',
          confidence: 0.9,
          reason: null,
          regions,
          svgUrl: `/moulds/custom/${id}/mould.svg`,
          sourceUrl: `/moulds/custom/${id}/mould.svg`,
          cropUrl: `/moulds/custom/${id}/mould.svg`,
        };
        fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(result, null, 2));
        job.status = 'ready';
        job.step = 'done';
        job.result = result;
        json(res, 200, { jobId: id, status: 'processing' });
        return true;
      }

      const ext = kind === 'jpeg' ? 'jpg' : kind;
      const inputPath = path.join(dir, `upload.${ext}`);
      fs.writeFileSync(inputPath, buffer);
      json(res, 200, { jobId: id, status: 'processing' });

      const crop = body.crop;
      const quad = body.quad?.flat();
      const args = [
        script,
        '--input',
        inputPath,
        '--out-dir',
        dir,
        '--id',
        id,
        '--status-file',
        path.join(dir, 'status.json'),
      ];
      if (crop) {
        args.push('--crop', `${Math.round(crop.x)},${Math.round(crop.y)},${Math.round(crop.w)},${Math.round(crop.h)}`);
      }
      if (quad && quad.length === 8) {
        args.push('--quad', quad.map((value) => Number(value).toFixed(2)).join(','));
      }

      job.status = 'processing';
      void spawnPython(args, path.dirname(script), 90_000)
        .then(() => {
          const resultPath = path.join(dir, 'result.json');
          if (!fs.existsSync(resultPath)) {
            job.status = 'failed';
            job.reason = 'unavailable';
            return;
          }
          const result = JSON.parse(fs.readFileSync(resultPath, 'utf8')) as Record<string, unknown>;
          job.result = result;
          job.status = result.published ? 'ready' : 'failed';
          job.reason = typeof result.reason === 'string' ? result.reason : undefined;
          job.step = job.status === 'ready' ? 'done' : 'failed';
        })
        .catch((error: Error) => {
          job.status = 'failed';
          job.step = 'failed';
          job.reason = error.message.includes('ENOENT') || error.message.toLowerCase().includes('python')
            ? 'unavailable'
            : 'failed-extract';
          fs.writeFileSync(
            path.join(dir, 'result.json'),
            JSON.stringify({ published: false, status: 'failed', reason: job.reason, jobId: id }),
          );
        });
      return true;
    }

    const match = pathname.match(/^\/api\/v1\/custom-moulds\/([a-z0-9]+)$/i);
    if (req.method === 'GET' && match) {
      const id = match[1];
      const job = jobs.get(id);
      const dir = path.join(publicCustom, id);
      const statusFile = path.join(dir, 'status.json');
      const resultFile = path.join(dir, 'result.json');
      let step = job?.step ?? 'uploaded';
      if (fs.existsSync(statusFile)) {
        try {
          const status = JSON.parse(fs.readFileSync(statusFile, 'utf8')) as { step?: string };
          if (status.step) {
            step = status.step;
          }
        } catch {
          /* ignore */
        }
      }
      if (fs.existsSync(resultFile)) {
        const result = JSON.parse(fs.readFileSync(resultFile, 'utf8')) as Record<string, unknown>;
        json(res, 200, {
          jobId: id,
          status: result.published ? 'ready' : 'failed',
          step: result.published ? 'done' : 'failed',
          reason: result.reason ?? undefined,
          result,
        });
        return true;
      }
      json(res, 200, {
        jobId: id,
        status: job?.status ?? 'processing',
        step,
        reason: job?.reason,
      });
      return true;
    }

    json(res, 404, { error: 'not-found' });
    return true;
  }

  function attach(server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
    cleanupCustomDir(publicCustom);
    fs.mkdirSync(publicCustom, { recursive: true });
    server.middlewares.use((req, res, next) => {
      void handle(req, res).then((handled) => {
        if (!handled) {
          next();
        }
      }).catch(() => {
        json(res, 500, { error: 'unavailable' });
      });
    });
  }

  return {
    name: 'custom-moulds',
    configureServer(server) {
      attach(server);
    },
    configurePreviewServer(server) {
      attach(server);
    },
  };
}
