import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Undo from '@mui/icons-material/Undo';
import Redo from '@mui/icons-material/Redo';
import ContentCopy from '@mui/icons-material/ContentCopy';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import Flip from '@mui/icons-material/Flip';
import FlipToFront from '@mui/icons-material/FlipToFront';
import FlipToBack from '@mui/icons-material/FlipToBack';
import FilterCenterFocus from '@mui/icons-material/FilterCenterFocus';
import RestartAlt from '@mui/icons-material/RestartAlt';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { ColorSelector } from '@/features/color/ColorSelector';
import { DEFAULT_REGION_HEX, normalizeHex } from '@/features/color/hex';
import { Button } from '@/components/ui/Button';
import { DEFAULT_MANUFACTURING, type CustomDesignDocument } from '../types';
import { useDesignerStore } from '../store/useDesignerStore';
import { exportDesignSvg } from '../geometry/svg';
import { fetchCustomDesign, fetchCustomDesigns, fetchManufacturingSettings, saveCustomDesign, updateCustomDesign } from '../api/designerApi';
import { fetchCementMould } from '@/features/simulator/api/simulatorApi';
import { parseOwnSvgToDocument } from '../geometry/parseOwnSvg';
import { localMotifAssist } from '../assist/designIntent';
import { TileCanvas } from '../components/TileCanvas';
import { LayersPanel, LiveRepeatPreview, ManufacturingPanel, ToolPalette } from '../components/DesignerPanels';

export function CustomDesignerPage({
  fromMould,
  designRef,
  onBack,
}: {
  fromMould?: string;
  designRef?: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const lang = useLang();
  const hexByCode: Record<string, string> = {};
  const { data: settings } = useQuery({
    queryKey: ['manufacturing-settings'],
    queryFn: fetchManufacturingSettings,
    retry: 1,
    staleTime: 60_000,
  });
  const manufacturing = settings
    ? {
        minRegionAreaMm2: settings.minRegionAreaMm2,
        minRegionWidthMm: settings.minRegionWidthMm,
        maxOverlapRatio: settings.maxOverlapRatio,
        minGapMm: settings.minGapMm,
      }
    : DEFAULT_MANUFACTURING;

  const document = useDesignerStore((state) => state.document);
  const activeRegionId = useDesignerStore((state) => state.activeRegionId);
  const setRegionColor = useDesignerStore((state) => state.setRegionColor);
  const setActiveRegion = useDesignerStore((state) => state.setActiveRegion);
  const undo = useDesignerStore((state) => state.undo);
  const redo = useDesignerStore((state) => state.redo);
  const reset = useDesignerStore((state) => state.reset);
  const duplicateSelected = useDesignerStore((state) => state.duplicateSelected);
  const deleteSelected = useDesignerStore((state) => state.deleteSelected);
  const mirrorSelected = useDesignerStore((state) => state.mirrorSelected);
  const bringForward = useDesignerStore((state) => state.bringForward);
  const sendBackward = useDesignerStore((state) => state.sendBackward);
  const alignCenter = useDesignerStore((state) => state.alignCenter);
  const setName = useDesignerStore((state) => state.setName);
  const loadDocument = useDesignerStore((state) => state.loadDocument);
  const markSaved = useDesignerStore((state) => state.markSaved);
  const savedId = useDesignerStore((state) => state.savedId);
  const savedReference = useDesignerStore((state) => state.savedReference);
  const selectedColor = document.regions.find((region) => region.id === activeRegionId)?.colorReference ?? undefined;
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const savedQuery = useQuery({
    queryKey: ['custom-designs'],
    queryFn: () => fetchCustomDesigns(1),
    retry: 1,
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.ctrlKey || event.metaKey;
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      } else if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      } else if (meta && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelected();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        const tag = (event.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          deleteSelected();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, duplicateSelected, deleteSelected]);

  useEffect(() => {
    if (!fromMould) {
      return;
    }
    void (async () => {
      const mould = await fetchCementMould(fromMould, lang);
      if (!mould.vectorAssetUrl) {
        return;
      }
      const markup = await (await fetch(mould.vectorAssetUrl)).text();
      const first = normalizeHex(mould.regions[0]?.defaultColorCode) ?? DEFAULT_REGION_HEX;
      const parsed = parseOwnSvgToDocument(markup, mould.reference, first);
      parsed.regions = parsed.regions.map((region) => {
        const match = mould.regions.find((item) => item.regionKey === region.id || (region.id === 'zone-bg' && item.regionKey === 'background'));
        const hex = normalizeHex(match?.defaultColorCode) ?? DEFAULT_REGION_HEX;
        return { ...region, colorReference: hex };
      });
      loadDocument(parsed);
    })();
  }, [fromMould, lang, loadDocument]);

  useEffect(() => {
    if (!designRef) {
      return;
    }
    void fetchCustomDesign(designRef).then((saved) => {
      const geometry = JSON.parse(saved.geometryJson) as CustomDesignDocument;
      loadDocument(geometry, { id: saved.id, reference: saved.reference });
    });
  }, [designRef, loadDocument]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const svgMarkup = exportDesignSvg(document, hexByCode);
      const thumbnailSvg = exportDesignSvg(document, hexByCode);
      const colorSummaryJson = JSON.stringify(
        Object.fromEntries(document.regions.map((region) => [region.id, region.colorReference])),
      );
      const payload = {
        name: document.name,
        widthCm: document.widthCm,
        heightCm: document.heightCm,
        geometryJson: JSON.stringify(document),
        svgMarkup,
        thumbnailSvg,
        repeatMode: document.repeatMode,
        colorSummaryJson,
      };
      if (savedId) {
        return updateCustomDesign(savedId, payload);
      }
      return saveCustomDesign(payload);
    },
    onSuccess: (saved) => {
      markSaved(saved.id, saved.reference);
      setStatus(t('designer.savedAs', { reference: saved.reference }));
      void savedQuery.refetch();
    },
    onError: () => setStatus(t('designer.saveFailed')),
  });

  return (
    <>
      <PageMeta title={t('designer.title')} description={t('designer.subtitle')} lang={lang} path="/cement-tiles/simulator" />
      <div className="bg-ivory pt-24 md:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-charcoal/10 px-4 py-4 md:px-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-charcoal-soft">{t('designer.eyebrow')}</p>
            <h1 className="font-display text-2xl text-charcoal md:text-3xl">{t('designer.title')}</h1>
            <p className="mt-1 max-w-2xl text-sm text-charcoal-soft/75">{t('designer.subtitle')}</p>
          </div>
          <button type="button" className="text-xs uppercase tracking-wide text-charcoal-soft" onClick={onBack}>
            {t('designer.changeStart')}
          </button>
        </div>

        <div className="hidden min-h-[78vh] grid-cols-12 gap-px bg-charcoal/10 lg:grid">
          <aside className="col-span-3 bg-ivory p-4">
            <ToolPalette />
            <div className="mt-4">
              <LayersPanel />
            </div>
          </aside>
          <section className="col-span-5 bg-ivory p-4">
            <div className="mb-3 flex flex-wrap items-center gap-1">
              <TextField size="small" value={document.name} onChange={(event) => setName(event.target.value)} label={t('designer.name')} />
              {savedReference ? <span className="text-xs uppercase tracking-wide text-charcoal-soft">{savedReference}</span> : null}
              <Tooltip title={t('designer.undo')}><IconButton size="small" onClick={undo}><Undo fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t('designer.redo')}><IconButton size="small" onClick={redo}><Redo fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t('designer.duplicate')}><IconButton size="small" onClick={duplicateSelected}><ContentCopy fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t('designer.delete')}><IconButton size="small" onClick={deleteSelected}><DeleteOutlined fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t('designer.mirrorH')}><IconButton size="small" onClick={() => mirrorSelected('x')}><Flip fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t('designer.mirrorV')}><IconButton size="small" onClick={() => mirrorSelected('y')}><Flip sx={{ transform: 'rotate(90deg)' }} fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t('designer.forward')}><IconButton size="small" onClick={bringForward}><FlipToFront fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t('designer.backward')}><IconButton size="small" onClick={sendBackward}><FlipToBack fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t('designer.alignCenter')}><IconButton size="small" onClick={alignCenter}><FilterCenterFocus fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t('designer.reset')}><IconButton size="small" onClick={reset}><RestartAlt fontSize="small" /></IconButton></Tooltip>
            </div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.designTile')} · {document.widthCm} × {document.heightCm} cm</p>
            <TileCanvas hexByCode={hexByCode} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {t('designer.save')}
              </Button>
              {status ? <p className="self-center text-xs text-charcoal-soft">{status}</p> : null}
            </div>
            <AssistBox prompt={prompt} onPrompt={setPrompt} />
          </section>
          <aside className="col-span-4 bg-ivory p-4">
            <LiveRepeatPreview hexByCode={hexByCode} />
            <ManufacturingPanel hexByCode={hexByCode} settings={manufacturing} />
          </aside>
        </div>

        <div className="border-t border-charcoal/10 px-4 py-4 md:px-8">
          <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.colors')}</h2>
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="flex flex-col gap-1">
              {document.regions.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => setActiveRegion(region.id)}
                  className={`flex items-center justify-between border px-2 py-1.5 text-xs ${activeRegionId === region.id ? 'border-charcoal bg-charcoal text-ivory' : 'border-charcoal/10'}`}
                >
                  <span>{region.name}</span>
                  <span className="uppercase">{region.colorReference ?? '—'}</span>
                </button>
              ))}
            </div>
            <ColorSelector mode="custom-rgb" value={selectedColor} onHexChange={(hex) => setRegionColor(activeRegionId, hex)} />
          </div>
        </div>

        {savedQuery.data?.items.length ? (
          <div className="px-4 pb-10 md:px-8">
            <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.savedDesigns')}</h2>
            <div className="flex flex-wrap gap-2">
              {savedQuery.data.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="border border-charcoal/10 px-3 py-2 text-left text-xs"
                  onClick={() => {
                    void fetchCustomDesign(item.reference).then((saved) => {
                      loadDocument(JSON.parse(saved.geometryJson) as CustomDesignDocument, { id: saved.id, reference: saved.reference });
                    });
                  }}
                >
                  <span className="block font-medium uppercase tracking-wide">{item.reference}</span>
                  <span className="text-charcoal-soft">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="lg:hidden px-4 pb-8">
          <p className="mb-3 text-sm text-charcoal-soft">{t('designer.mobileHint')}</p>
          <TileCanvas hexByCode={hexByCode} />
        </div>
      </div>
    </>
  );
}

function AssistBox({ prompt, onPrompt }: { prompt: string; onPrompt: (value: string) => void }) {
  const { t } = useTranslation();
  const loadDocument = useDesignerStore((state) => state.loadDocument);
  return (
    <div className="mt-4 border border-charcoal/10 p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.assistTitle')}</p>
      <p className="mt-1 text-xs text-charcoal-soft/70">{t('designer.assistBody')}</p>
      <div className="mt-2 flex gap-2">
        <input
          className="min-w-0 flex-1 border border-charcoal/15 bg-ivory px-2 py-2 text-sm"
          value={prompt}
          onChange={(event) => onPrompt(event.target.value)}
          placeholder={t('designer.assistPlaceholder')}
        />
        <button
          type="button"
          className="border border-charcoal px-3 py-2 text-xs uppercase tracking-wide"
          onClick={() => {
            void localMotifAssist.generate(prompt).then(loadDocument);
          }}
        >
          {t('designer.assistApply')}
        </button>
      </div>
    </div>
  );
}
