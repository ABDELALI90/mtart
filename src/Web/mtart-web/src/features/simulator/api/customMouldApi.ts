export interface CustomMouldRegion {
  key: string;
  name: string;
}

export type CustomMouldKind = 'svg' | 'uploaded-image';

export interface CustomMould {
  id: string;
  jobId: string;
  sourceImage: string;
  svgUrl: string;
  kind?: CustomMouldKind;
  regions: CustomMouldRegion[];
  custom: true;
  createdAt: number;
}

export function isUploadedImageMould(mould?: Pick<CustomMould, 'kind' | 'svgUrl'> | null) {
  if (!mould) {
    return false;
  }
  return (mould.kind ?? (mould.svgUrl ? 'svg' : 'uploaded-image')) === 'uploaded-image';
}

export interface CustomMouldJobResult {
  jobId: string;
  published?: boolean;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  step?: string;
  reason?: string | null;
  result?: {
    jobId: string;
    published: boolean;
    status: string;
    confidence?: number;
    reason?: string | null;
    regions?: CustomMouldRegion[];
    svgUrl?: string | null;
    sourceUrl?: string | null;
    cropUrl?: string | null;
  };
}

export async function startCustomMouldJob(payload: {
  imageBase64: string;
  mimeType: string;
  crop?: { x: number; y: number; w: number; h: number };
  quad?: number[][];
}): Promise<{ jobId: string }> {
  const response = await fetch('/api/v1/custom-moulds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'unavailable' }));
    throw new Error(typeof body.error === 'string' ? body.error : 'unavailable');
  }
  return response.json() as Promise<{ jobId: string }>;
}

export async function pollCustomMouldJob(jobId: string): Promise<CustomMouldJobResult> {
  const response = await fetch(`/api/v1/custom-moulds/${jobId}`);
  if (!response.ok) {
    throw new Error('unavailable');
  }
  return response.json() as Promise<CustomMouldJobResult>;
}
