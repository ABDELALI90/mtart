import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Plus } from 'lucide-react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CloseIcon from '@mui/icons-material/Close';
import { SquareCropper } from './SquareCropper';
import type { CustomMould } from '../api/customMouldApi';
import { rasterizeCroppedTile } from '../utils/cropImage';
import { defaultQuad, initialCrop, isDefaultQuad, type PixelCrop, type QuadPoint } from '../utils/cropGeometry';
import { validateUploadFile, type UploadErrorCode } from '../utils/uploadValidation';

type Stage = 'idle' | 'crop' | 'processing' | 'review' | 'failed';

export function DesignUploadDialog({
  open,
  onClose,
  onAccept,
}: {
  open: boolean;
  onClose: () => void;
  onAccept: (mould: Omit<CustomMould, 'id' | 'custom' | 'createdAt'> & { id?: string }) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<UploadErrorCode | 'failed-extract' | 'unavailable' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [natural, setNatural] = useState({ width: 1, height: 1 });
  const [crop, setCrop] = useState<PixelCrop>({ x: 0, y: 0, size: 32 });
  const [angled, setAngled] = useState(false);
  const [quad, setQuad] = useState<QuadPoint[]>(defaultQuad());
  const [result, setResult] = useState<{ sourceUrl: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setStage('idle');
    setError(null);
    setFile(null);
    setResult(null);
    setAngled(false);
    setQuad(defaultQuad());
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function takeFile(next: File) {
    const check = await validateUploadFile(next);
    if (!check.ok) {
      setError(check.code);
      setStage('idle');
      return;
    }
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(next);
    const image = new Image();
    image.onload = () => {
      setNatural({ width: image.naturalWidth || 512, height: image.naturalHeight || 512 });
      setCrop(initialCrop(image.naturalWidth || 512, image.naturalHeight || 512));
      setFile(next);
      setPreviewUrl(url);
      setError(null);
      setStage('crop');
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError('invalid');
      setStage('idle');
    };
    image.src = url;
  }

  async function useSelectedArea() {
    if (!previewUrl) {
      return;
    }
    setStage('processing');
    setError(null);
    try {
      const cropped = await rasterizeCroppedTile(
        previewUrl,
        crop,
        angled && !isDefaultQuad(quad) ? quad : undefined,
      );
      setResult({ sourceUrl: cropped.dataUrl });
      setStage('review');
    } catch (caught) {
      console.error('Preview render failed', caught);
      setError('unavailable');
      setStage('failed');
    }
  }

  const errorCopy = useMemo(() => {
    if (!error) {
      return null;
    }
    if (error === 'too-small') {
      return t('simulator.upload.tooSmall');
    }
    if (error === 'too-large') {
      return t('simulator.upload.tooLarge');
    }
    if (error === 'bad-type' || error === 'invalid') {
      return t('simulator.upload.badType');
    }
    if (error === 'unavailable') {
      return t('simulator.upload.unavailable');
    }
    return t('simulator.upload.failed');
  }, [error, t]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      fullScreen={false}
      aria-labelledby="design-upload-title"
      slotProps={{
        paper: {
          sx: {
            width: { xs: 'calc(100vw - 24px)', sm: 'min(90vw, 850px)' },
            maxWidth: { xs: 'calc(100vw - 24px)', sm: 850 },
            maxHeight: { xs: '88vh', sm: '75vh' },
            m: { xs: '12px', sm: 2 },
            overflow: 'auto',
          },
        },
      }}
    >
      <DialogTitle id="design-upload-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, fontFamily: 'ui-serif, Georgia, serif', py: 1.5 }}>
        {stage === 'review' ? t('simulator.upload.ready') : t('simulator.upload.title')}
        <IconButton onClick={onClose} aria-label={t('simulator.back')} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ overflow: 'auto' }}>
        {stage === 'idle' ? (
          <label
            className={clsx(
              'flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-6 py-6 text-center',
              dragging ? 'border-charcoal bg-charcoal/5' : 'border-charcoal/25 bg-ivory-dark',
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const next = event.dataTransfer.files[0];
              if (next) {
                void takeFile(next);
              }
            }}
          >
            <Plus className="h-8 w-8 text-charcoal-soft" />
            <p className="font-display text-xl text-charcoal">{t('simulator.upload.title')}</p>
            <p className="text-sm text-charcoal-soft">{t('simulator.upload.drag')}</p>
            <p className="text-xs uppercase tracking-wide text-charcoal-soft">{t('simulator.upload.or')}</p>
            <span className="border border-charcoal/20 bg-ivory px-4 py-2 text-sm uppercase tracking-wide">{t('simulator.upload.choose')}</span>
            <p className="mt-2 text-[11px] uppercase tracking-wide text-charcoal-soft">{t('simulator.upload.formats')}</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              onChange={(event) => {
                const next = event.target.files?.[0];
                if (next) {
                  void takeFile(next);
                }
              }}
            />
          </label>
        ) : null}

        {stage === 'crop' && previewUrl ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-charcoal">{t('simulator.upload.cropHint')}</p>
            <SquareCropper
              src={previewUrl}
              naturalWidth={natural.width}
              naturalHeight={natural.height}
              crop={crop}
              onCrop={setCrop}
              angled={angled}
              quad={quad}
              onQuad={setQuad}
            />
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input type="checkbox" checked={angled} onChange={(event) => setAngled(event.target.checked)} />
              {t('simulator.upload.angled')}
            </label>
            <Button variant="contained" onClick={() => void useSelectedArea()} disabled={!file} sx={{ alignSelf: 'flex-start' }}>
              {t('simulator.upload.useCrop')}
            </Button>
          </div>
        ) : null}

        {stage === 'processing' ? (
          <div className="flex flex-col gap-4 py-6">
            <p className="font-display text-xl text-charcoal">{t('simulator.upload.preparing')}</p>
          </div>
        ) : null}

        {stage === 'review' && result ? (
          <div className="flex flex-col gap-4">
            <figure className="mx-auto max-h-[min(50vh,500px)] max-w-[500px] border border-charcoal/10 bg-white p-2">
              <img src={result.sourceUrl} alt="" className="aspect-square max-h-[min(46vh,460px)] w-full object-contain" />
              <figcaption className="pt-2 text-center text-[11px] uppercase tracking-wide text-charcoal-soft">
                {t('simulator.upload.original')}
              </figcaption>
            </figure>
            <p className="text-sm text-charcoal">{t('simulator.pickColorHint')}</p>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant="contained"
                onClick={() => {
                  onAccept({
                    jobId: `local-${Date.now()}`,
                    sourceImage: result.sourceUrl,
                    svgUrl: '',
                    kind: 'uploaded-image',
                    regions: [],
                  });
                }}
              >
                {t('simulator.upload.useMould')}
              </Button>
              <Button variant="outlined" onClick={() => setStage('idle')}>
                {t('simulator.upload.tryAnother')}
              </Button>
            </Stack>
          </div>
        ) : null}

        {stage === 'failed' ? (
          <div className="flex flex-col gap-3 py-4">
            <p className="text-sm text-charcoal">{errorCopy}</p>
            <Button variant="outlined" onClick={() => setStage('idle')} sx={{ alignSelf: 'flex-start' }}>
              {t('simulator.upload.tryAnother')}
            </Button>
          </div>
        ) : null}

        {error && stage === 'idle' ? (
          <Typography color="text.secondary" variant="body2" sx={{ mt: 2 }}>
            {errorCopy}
          </Typography>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function UploadDesignCard({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex aspect-auto flex-col items-center justify-center border border-dashed border-charcoal/30 bg-white p-2 text-center hover:border-charcoal/60"
    >
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-1">
        <Plus className="h-7 w-7 text-charcoal-soft" />
        <span className="px-1 text-[10px] uppercase leading-tight tracking-wide text-charcoal">{t('simulator.upload.card')}</span>
      </div>
    </button>
  );
}
