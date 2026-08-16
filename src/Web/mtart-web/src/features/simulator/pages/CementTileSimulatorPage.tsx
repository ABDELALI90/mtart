import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { useCementMould, useCementMoulds, useMouldCategories } from '../hooks/useCementMoulds';
import {
  applyImageColor,
  cancelImagePreview,
  clearImageSelection,
  getImageSession,
  previewImageColor,
  redoImageEdit,
  resetImageAll,
  resetImageArea,
  reselectLastImageSurface,
  undoImageEdit,
} from '../utils/imageColorSession';
import { matchesMouldSearch } from '../data/catalogue';
import { isRenderableMould } from '../data/mouldAssets';
import { useSvgRegions } from '../hooks/useSvgRegions';
import {
  useSimulatorStore,
} from '../store/useSimulatorStore';
import { calculateSurface, defaultsFromRegions, parseShareParams, resolveRegionKeys, serializeShareParams } from '../utils/config';
import { MouldBrowser } from '../components/MouldBrowser';
import { SimulatorStartGate } from '../components/SimulatorStartGate';
import { CustomDesignerPage } from '@/features/designer/pages/CustomDesignerPage';
import { RegionColorPopover } from '@/features/color/RegionColorPopover';
import { DEFAULT_REGION_HEX } from '@/features/color/hex';
import { ConfigurableTile, type RegionClickInfo } from '../components/ConfigurableTile';
import { ImageColorTile, type ImageSurfaceClick } from '../components/ImageColorTile';
import { RoomScenePreview } from '../components/RoomScenePreview';
import { DesignUploadDialog } from '../components/DesignUploadDialog';
import { SurfaceCalculator } from '../components/SurfaceCalculator';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/utils/paths';
import type { PatternRegion } from '@/types/catalog';
import { customToDetail, customToListItem, useCustomMoulds } from '../hooks/useCustomMoulds';
import { isUploadedImageMould } from '../api/customMouldApi';
import { useImageColorSession } from '../hooks/useImageColorSession';
import { DEFAULT_IMAGE_TOLERANCE, type ImageColorMode } from '../utils/imageColor';
import { rasterImageTextureUrl, tileTextureUrl } from '../utils/tileTexture';
import type { TileSizeCm } from '../store/useSimulatorStore';
import type { Rotation } from '../utils/config';

const STEPS = ['design', 'colors', 'preview'] as const;
const TILE_FAMILIES = ['cement', 'zellige', 'bjmat'] as const;
const TILE_SIZES: TileSizeCm[] = [30, 25, 20, 15, 10];
const ROTATIONS: Rotation[] = [0, 90, 180, 270];
type TileFamily = (typeof TILE_FAMILIES)[number];

export function CementTileSimulatorPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const [params, setParams] = useSearchParams();
  const startMode = params.get('start');

  if (!startMode) {
    return (
      <>
        <PageMeta title={t('simulator.title')} description={t('simulator.subtitle')} lang={lang} path="/cement-tiles/simulator" />
        <div className="bg-ivory pt-24 md:pt-28">
          <SimulatorStartGate
            onChooseReference={() => setParams({ start: 'choose' }, { replace: true })}
            onCreateDesign={() => setParams({ start: 'create' }, { replace: true })}
          />
        </div>
      </>
    );
  }

  if (startMode === 'create') {
    return (
      <CustomDesignerPage
        fromMould={params.get('from') ?? undefined}
        designRef={params.get('design') ?? undefined}
        onBack={() => setParams({}, { replace: true })}
      />
    );
  }

  return <CatalogSimulator />;
}

function CatalogSimulator() {
  const { t } = useTranslation();
  const lang = useLang();
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [tileFamily, setTileFamily] = useState<TileFamily>(() => {
    const mould = (params.get('mould') ?? '').toUpperCase();
    return mould.startsWith('ZL') ? 'zellige' : 'cement';
  });
  const [step, setStep] = useState<(typeof STEPS)[number]>('design');
  const [advanced, setAdvanced] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [colorPopup, setColorPopup] = useState<{
    regionId: string;
    matchingIds: string[];
    x: number;
    y: number;
  } | null>(null);
  const [applyMatching, setApplyMatching] = useState(false);
  const [imageDraftHex, setImageDraftHex] = useState(DEFAULT_REGION_HEX);
  const [imageColorMode, setImageColorMode] = useState<ImageColorMode>('texture');
  const [imageTolerance, setImageTolerance] = useState(DEFAULT_IMAGE_TOLERANCE);
  const [applyError, setApplyError] = useState<string | null>(null);
  const applyMatchingRef = useRef(false);
  const isCommittingRef = useRef(false);
  const colorPopupRef = useRef(colorPopup);
  const imageDraftHexRef = useRef(imageDraftHex);
  const imageColorModeRef = useRef(imageColorMode);
  const committedRegionColorsRef = useRef<Record<string, string>>({});
  const hydrated = useRef(false);
  colorPopupRef.current = colorPopup;
  imageDraftHexRef.current = imageDraftHex;
  imageColorModeRef.current = imageColorMode;
  const skipNextUrlWrite = useRef(true);
  const skipRegionReset = useRef(false);
  const lastPatternId = useRef<string | undefined>(undefined);

  const patternKey = useSimulatorStore((state) => state.patternKey);
  const setPattern = useSimulatorStore((state) => state.setPattern);
  const regionColors = useSimulatorStore((state) => state.regionColors);
  const setRegionColor = useSimulatorStore((state) => state.setRegionColor);
  const setRegionColors = useSimulatorStore((state) => state.setRegionColors);
  const activeRegion = useSimulatorStore((state) => state.activeRegion);
  const setActiveRegion = useSimulatorStore((state) => state.setActiveRegion);
  const setPendingColor = useSimulatorStore((state) => state.setPendingColor);
  applyMatchingRef.current = applyMatching;
  const rotation = useSimulatorStore((state) => state.rotation);
  const rotate = useSimulatorStore((state) => state.rotate);
  const setRotation = useSimulatorStore((state) => state.setRotation);
  const repeat = useSimulatorStore((state) => state.repeat);
  const setRepeat = useSimulatorStore((state) => state.setRepeat);
  const tileSizeCm = useSimulatorStore((state) => state.tileSizeCm);
  const setTileSizeCm = useSimulatorStore((state) => state.setTileSizeCm);
  const resetColors = useSimulatorStore((state) => state.resetColors);
  const surfaceM2 = useSimulatorStore((state) => state.surfaceM2);
  const setSurface = useSimulatorStore((state) => state.setSurface);
  const wastePercent = useSimulatorStore((state) => state.wastePercent);
  const setWaste = useSimulatorStore((state) => state.setWaste);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const { items: customMoulds, addMould } = useCustomMoulds();
  const customItems = useMemo(() => customMoulds.map(customToListItem), [customMoulds]);
  const mouldFamily = tileFamily === 'bjmat' ? undefined : tileFamily;
  const { data: categories = [] } = useMouldCategories(lang);
  const mouldQuery = useCementMoulds(lang, mouldFamily, undefined, undefined, tileFamily !== 'bjmat');
  const catalogueMoulds = useMemo(
    () => mouldQuery.items.filter(isRenderableMould),
    [mouldQuery.items],
  );
  const moulds = useMemo(() => {
    const byCategory = category ? catalogueMoulds.filter((item) => item.categorySlug === category) : catalogueMoulds;
    const filtered = search ? byCategory.filter((item) => matchesMouldSearch(item, search)) : byCategory;
    const customs = search
      ? customItems.filter((item) => matchesMouldSearch(item, search))
      : customItems;
    return [...customs, ...filtered];
  }, [catalogueMoulds, category, search, customItems]);
  const parsedUrl = useMemo(() => parseShareParams(params), [params]);
  const selectedKey = patternKey ?? parsedUrl.mould ?? (tileFamily === 'bjmat' ? undefined : moulds[0]?.reference);
  const selectedCustom = customMoulds.find((item) => item.id === selectedKey || item.id === patternKey);
  const uploadedImage = isUploadedImageMould(selectedCustom);
  const imageSession = useImageColorSession(uploadedImage ? selectedCustom?.id : undefined, uploadedImage ? selectedCustom?.sourceImage : undefined);
  const { data: catalogPattern } = useCementMould(selectedCustom ? undefined : selectedKey, lang);
  const pattern = selectedCustom ? customToDetail(selectedCustom) : catalogPattern;
  const svgKeys = useSvgRegions(pattern?.vectorAssetUrl);
  const editorRegions = useMemo<PatternRegion[]>(() => {
    if (!pattern) {
      return [];
    }
    const keys = resolveRegionKeys(pattern.regions.map((region) => region.regionKey), svgKeys);
    const byKey = new Map(pattern.regions.map((region) => [region.regionKey, region]));
    return keys.map((key, index) => byKey.get(key) ?? {
      id: key,
      regionKey: key,
      displayName: key.replace(/[-_]/g, ' '),
      defaultColorId: null,
      defaultColorCode: null,
      displayOrder: index,
    });
  }, [pattern, svgKeys]);

  useEffect(() => {
    if (tileFamily === 'bjmat' || catalogueMoulds.length === 0) {
      return;
    }
    const urlMould = parsedUrl.mould;
    const isCustom = Boolean(patternKey?.toUpperCase().startsWith('CUSTOM-') || urlMould?.toUpperCase().startsWith('CUSTOM-'));
    if (isCustom) {
      if (urlMould && urlMould !== patternKey && !hydrated.current) {
        setPattern(urlMould);
      }
      return;
    }
    const urlInFamily = Boolean(
      urlMould && catalogueMoulds.some((item) => item.reference === urlMould || item.slug === urlMould),
    );
    if (urlInFamily && urlMould && urlMould !== patternKey && !hydrated.current) {
      setPattern(urlMould);
      return;
    }
    const visible = Boolean(
      patternKey && catalogueMoulds.some((item) => item.reference === patternKey || item.slug === patternKey),
    );
    if (!visible) {
      setPattern(catalogueMoulds[0].reference);
      setCategory(undefined);
    }
  }, [parsedUrl.mould, patternKey, catalogueMoulds, tileFamily, setPattern]);

  useEffect(() => {
    if (!pattern) {
      return;
    }
    const fromUrl = parseShareParams(params, pattern.regions.map((region) => region.regionKey));
    const matchesMould = fromUrl.mould === pattern.reference || fromUrl.mould === pattern.slug;
    const switched = Boolean(lastPatternId.current && lastPatternId.current !== pattern.id);
    lastPatternId.current = pattern.id;

    if (!hydrated.current && matchesMould && Object.keys(fromUrl.regionColors ?? {}).length > 0) {
      setRegionColors({ ...defaultsFromRegions(pattern.regions), ...fromUrl.regionColors });
      if (fromUrl.rotation) {
        setRotation(fromUrl.rotation);
      }
      if (fromUrl.repeat) {
        setRepeat(fromUrl.repeat);
      }
    } else if (skipRegionReset.current) {
      skipRegionReset.current = false;
    } else if (switched || !hydrated.current) {
      setRegionColors(defaultsFromRegions(pattern.regions.length > 0 ? pattern.regions : editorRegions));
      setPendingColor(undefined);
    }

    setColorPopup(null);
    setActiveRegion('');
    const keys = pattern.regions.length > 0 ? pattern.regions : editorRegions;
    hydrated.current = true;
    skipNextUrlWrite.current = true;
    if (import.meta.env.DEV) {
      console.debug('[simulator] selected mould', pattern.reference, 'regions', keys.map((region) => region.regionKey));
    }
  }, [pattern?.id]);

  useEffect(() => {
    if (!pattern || svgKeys.length === 0) {
      return;
    }
    const current = useSimulatorStore.getState().regionColors;
    const missing = svgKeys.filter((key) => !current[key]);
    if (missing.length === 0) {
      return;
    }
    setRegionColors({
      ...current,
      ...Object.fromEntries(missing.map((key) => [key, DEFAULT_REGION_HEX])),
    });
  }, [pattern?.id, svgKeys.join(',')]);

  function handleImageColorChange(hex: string) {
    imageDraftHexRef.current = hex;
    setImageDraftHex(hex);
    if (selectedCustom && uploadedImage) {
      previewImageColor(selectedCustom.id, hex, imageColorModeRef.current);
    }
  }

  function handleImageModeChange(mode: ImageColorMode) {
    imageColorModeRef.current = mode;
    setImageColorMode(mode);
    if (selectedCustom && uploadedImage && colorPopupRef.current) {
      previewImageColor(selectedCustom.id, imageDraftHexRef.current, mode);
    }
  }

  function handleApplyMatchingChange(next: boolean) {
    setApplyMatching(next);
    applyMatchingRef.current = next;
    if (uploadedImage && selectedCustom && colorPopupRef.current) {
      reselectLastImageSurface(selectedCustom.id, imageTolerance, next);
      previewImageColor(selectedCustom.id, imageDraftHexRef.current, imageColorModeRef.current);
      return;
    }
    if (next && colorPopupRef.current && !uploadedImage) {
      const current = regionColors[colorPopupRef.current.regionId] ?? DEFAULT_REGION_HEX;
      paintTargets(current, colorPopupRef.current.matchingIds);
    }
  }

  function openColorPopup(next: { regionId: string; matchingIds: string[]; x: number; y: number }) {
    committedRegionColorsRef.current = { ...useSimulatorStore.getState().regionColors };
    colorPopupRef.current = next;
    setApplyError(null);
    setColorPopup(next);
  }

  function handleCommitColor() {
    if (isCommittingRef.current || !colorPopupRef.current) {
      return;
    }
    isCommittingRef.current = true;
    setApplyError(null);
    try {
      if (uploadedImage && selectedCustom) {
        const session = getImageSession(selectedCustom.id);
        const canCommit = Boolean(
          session?.preview
          || (session?.mask && session.indices.length > 0),
        );
        if (canCommit) {
          const applied = applyImageColor(selectedCustom.id, imageDraftHexRef.current, imageColorModeRef.current);
          if (!applied) {
            console.error('Color apply failed', { reason: 'commit-rejected', id: selectedCustom.id });
            setApplyError(t('simulator.applyFailed'));
            return;
          }
        } else {
          clearImageSelection(selectedCustom.id);
        }
      } else {
        committedRegionColorsRef.current = { ...useSimulatorStore.getState().regionColors };
      }
      colorPopupRef.current = null;
      setColorPopup(null);
      setActiveRegion('');
    } catch (error) {
      console.error('Color apply failed', error);
      setApplyError(t('simulator.applyFailed'));
    } finally {
      queueMicrotask(() => {
        isCommittingRef.current = false;
      });
    }
  }

  function handleCancelColor() {
    if (isCommittingRef.current) {
      return;
    }
    setApplyError(null);
    if (uploadedImage && selectedCustom) {
      cancelImagePreview(selectedCustom.id);
    } else {
      setRegionColors({ ...committedRegionColorsRef.current });
    }
    colorPopupRef.current = null;
    setColorPopup(null);
    setActiveRegion('');
  }

  function handleImageSelect(info: ImageSurfaceClick) {
    setImageDraftHex(info.seedHex);
    imageDraftHexRef.current = info.seedHex;
    setActiveRegion('image-surface');
    openColorPopup({
      regionId: 'image-surface',
      matchingIds: ['image-surface'],
      x: info.clientX,
      y: info.clientY,
    });
  }

  function handleBeforeImageSelect() {
    handleCommitColor();
  }

  function paintTargets(hex: string, ids?: string[]) {
    const popup = colorPopupRef.current;
    const targets = ids ?? (
      applyMatchingRef.current && popup
        ? popup.matchingIds
        : popup
          ? [popup.regionId]
          : []
    );
    if (targets.length === 0) {
      return;
    }
    const next = { ...useSimulatorStore.getState().regionColors };
    for (const id of targets) {
      next[id] = hex;
    }
    setRegionColors(next);
  }

  function handleRegionClick(regionKey: string, info?: RegionClickInfo) {
    handleCommitColor();
    setActiveRegion(regionKey);
    openColorPopup({
      regionId: regionKey,
      matchingIds: info?.matchingIds?.length ? info.matchingIds : [regionKey],
      x: info?.clientX ?? 24,
      y: info?.clientY ?? 24,
    });
  }

  function handleResetAll() {
    if (uploadedImage && selectedCustom) {
      resetImageAll(selectedCustom.id);
      colorPopupRef.current = null;
      setColorPopup(null);
      return;
    }
    const keys = new Set([...svgKeys, ...Object.keys(useSimulatorStore.getState().regionColors)]);
    setRegionColors(Object.fromEntries([...keys].map((key) => [key, DEFAULT_REGION_HEX])));
    colorPopupRef.current = null;
    setColorPopup(null);
    setActiveRegion('');
  }
  const unitsPerM2 = pattern?.unitsPerM2 ?? 25;
  const weightPerM2 = pattern?.weightPerM2Kg ?? 18;
  const pricePerM2 = pattern?.priceVisibility === 'Public' ? pattern.pricePerM2 ?? 0 : 0;
  const estimate = calculateSurface({ surfaceM2, wastePercent, unitsPerM2, weightPerM2Kg: weightPerM2, pricePerM2 });

  const shareQuery = useMemo(() => {
    if (!pattern) {
      return new URLSearchParams();
    }
    const query = serializeShareParams({
      mould: pattern.reference,
      regionColors,
      rotation,
      repeat,
    });
    query.set('start', 'choose');
    query.set('start', 'choose');
    query.set('tileCm', String(tileSizeCm));
    if (pattern.reference.toUpperCase().startsWith('CUSTOM-')) {
      query.set('custom', '1');
    }
    return query;
  }, [pattern, regionColors, rotation, repeat, tileSizeCm]);

  useEffect(() => {
    if (!shareQuery.get('mould') || !hydrated.current) {
      return;
    }
    if (skipNextUrlWrite.current) {
      skipNextUrlWrite.current = false;
      return;
    }
    setParams(shareQuery, { replace: true });
  }, [shareQuery, setParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (uploadedImage && imageSession.textureUrl) {
        void rasterImageTextureUrl(imageSession.textureUrl, rotation, 2)
          .then((url) => sessionStorage.setItem('mtart.quotePreview', url))
          .catch(() => undefined);
        return;
      }
      if (!pattern?.vectorAssetUrl) {
        return;
      }
      void tileTextureUrl(pattern.vectorAssetUrl, regionColors, rotation, 2).then((url) => {
        sessionStorage.setItem('mtart.quotePreview', url);
      }).catch(() => undefined);
    }, 120);
    return () => window.clearTimeout(handle);
  }, [pattern?.vectorAssetUrl, regionColors, rotation, uploadedImage, imageSession.textureUrl, imageSession.revision]);

  const shareUrl = `${ROUTES.cementSimulator(lang)}?${shareQuery.toString()}`;
  const regionSummary = editorRegions.map((region) => regionColors[region.regionKey] ?? '—').join(' · ');
  const isCustom = Boolean(pattern?.reference.toUpperCase().startsWith('CUSTOM-'));
  const quoteHref = pattern
    ? `${ROUTES.requestQuote(lang)}?product=${encodeURIComponent(pattern.name)}&reference=${pattern.reference}&color=${encodeURIComponent(regionSummary)}&format=${encodeURIComponent(`${tileSizeCm}x${tileSizeCm}`)}&quantityM2=${estimate.requiredM2.toFixed(1)}&mould=${encodeURIComponent(pattern.reference)}&shareUrl=${encodeURIComponent(shareUrl)}&priceEstimate=${estimate.total}&custom=${isCustom ? '1' : '0'}&tileCm=${tileSizeCm}&rot=${rotation}${selectedCustom?.sourceImage ? `&sourceUpload=${encodeURIComponent(selectedCustom.sourceImage)}` : ''}`
    : ROUTES.requestQuote(lang);

  const vectorUrl = pattern?.vectorAssetUrl ?? '';
  const liveTile = uploadedImage && selectedCustom ? (
    <ImageColorTile
      mouldId={selectedCustom.id}
      sourceUrl={selectedCustom.sourceImage}
      applyMatching={applyMatching}
      tolerance={imageTolerance}
      onBeforeSelect={handleBeforeImageSelect}
      onSelect={handleImageSelect}
      className="aspect-square w-full bg-white"
    />
  ) : vectorUrl ? (
    <ConfigurableTile
      src={vectorUrl}
      regionColors={regionColors}
      colors={[]}
      rotation={rotation}
      activeRegion={activeRegion}
      onRegionClick={handleRegionClick}
      className="aspect-square w-full bg-white [&_svg]:h-full [&_svg]:w-full"
      mode="color"
    />
  ) : (
    <div className="aspect-square bg-white" />
  );

  function selectDesign(key: string) {
    setPattern(key);
    setStep('colors');
  }

  const familyTabs = (
    <div className="mb-3 flex flex-wrap gap-1">
      {TILE_FAMILIES.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => {
            setTileFamily(item);
            setCategory(undefined);
            setSearchInput('');
            setStep('design');
          }}
          className={clsx(
            'px-3 py-1.5 text-[11px] uppercase tracking-wide',
            tileFamily === item ? 'bg-charcoal text-ivory' : 'border border-charcoal/15 hover:border-charcoal/40',
          )}
        >
          {t(`simulator.tileTypes.${item}`)}
        </button>
      ))}
    </div>
  );

  const mouldBrowser = (
    <MouldBrowser
      categories={categories}
      moulds={moulds}
      catalogueMoulds={catalogueMoulds}
      selectedReference={pattern?.reference}
      search={searchInput}
      categorySlug={category}
      onSearch={setSearchInput}
      onCategory={setCategory}
      onSelect={selectDesign}
      onUpload={() => setUploadOpen(true)}
    />
  );

  const colorPanel = (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="mb-2 text-sm text-charcoal">{t('simulator.pickColorHint')}</p>
      <div className="mb-3 w-full max-w-md border border-charcoal/10 bg-white p-2">{liveTile}</div>
      <p className="mb-1 text-[11px] uppercase tracking-wide text-charcoal-soft">{pattern?.reference}</p>
      <RegionColorPopover
        open={Boolean(colorPopup)}
        x={colorPopup?.x ?? 0}
        y={colorPopup?.y ?? 0}
        value={uploadedImage ? imageDraftHex : colorPopup ? regionColors[colorPopup.regionId] ?? DEFAULT_REGION_HEX : DEFAULT_REGION_HEX}
        onChange={(hex) => uploadedImage ? handleImageColorChange(hex) : paintTargets(hex)}
        onApply={handleCommitColor}
        applyError={applyError}
        onResetArea={() => {
          if (uploadedImage && selectedCustom) {
            resetImageArea(selectedCustom.id);
            colorPopupRef.current = null;
            setColorPopup(null);
            return;
          }
          if (colorPopup) {
            setRegionColor(colorPopup.regionId, DEFAULT_REGION_HEX);
          }
        }}
        onResetAll={handleResetAll}
        onClose={handleCommitColor}
        onCancel={handleCancelColor}
        applyMatching={applyMatching}
        onApplyMatchingChange={handleApplyMatchingChange}
        showColorMode={uploadedImage}
        colorMode={imageColorMode}
        onColorModeChange={handleImageModeChange}
        showCancel={uploadedImage}
      />
      {uploadedImage && selectedCustom ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="border border-charcoal/20 px-3 py-1.5 text-xs uppercase" disabled={!imageSession.canUndo} onClick={() => undoImageEdit(selectedCustom.id)}>{t('designer.undo')}</button>
          <button type="button" className="border border-charcoal/20 px-3 py-1.5 text-xs uppercase" disabled={!imageSession.canRedo} onClick={() => redoImageEdit(selectedCustom.id)}>{t('designer.redo')}</button>
          <button type="button" className="border border-charcoal/20 px-3 py-1.5 text-xs uppercase" onClick={() => resetImageAll(selectedCustom.id)}>{t('designer.reset')}</button>
        </div>
      ) : null}
      <button type="button" className="mt-3 self-start text-[11px] uppercase tracking-wide text-charcoal-soft" onClick={() => setAdvanced((value) => !value)}>
        {t('simulator.advanced')}
      </button>
      {advanced ? (
        <div className="mt-2 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="border border-charcoal/20 px-3 py-1.5 text-xs uppercase" onClick={rotate}>{t('simulator.rotate')}</button>
            <button type="button" className="border border-charcoal/20 px-3 py-1.5 text-xs uppercase" onClick={() => uploadedImage && selectedCustom ? resetImageAll(selectedCustom.id) : resetColors(defaultsFromRegions(editorRegions))}>{t('simulator.reset')}</button>
          </div>
          {uploadedImage ? (
            <label className="max-w-md">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-charcoal-soft">{t('simulator.selectionSensitivity')}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={imageTolerance}
                onChange={(event) => setImageTolerance(Number(event.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] uppercase tracking-wide text-charcoal-soft">
                <span>{t('simulator.precise')}</span>
                <span>{t('simulator.broad')}</span>
              </div>
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const previewPanel = (
    <div className="flex min-h-0 flex-col gap-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('simulator.livePreview')}</p>
      <RoomScenePreview
        key={pattern?.id ?? selectedCustom?.id ?? 'floor'}
        imageUrl={uploadedImage ? (imageSession.textureUrl || selectedCustom?.sourceImage) : undefined}
        imageRevision={imageSession.revision}
        vectorUrl={uploadedImage ? undefined : vectorUrl || undefined}
        regionColors={regionColors}
        rotation={rotation}
        tileSizeCm={tileSizeCm}
      />
      <div>
        <p className="mb-1 text-[11px] uppercase tracking-wide text-charcoal-soft">{t('simulator.tileSize')}</p>
        <input
          type="range"
          min={0}
          max={TILE_SIZES.length - 1}
          value={TILE_SIZES.indexOf(tileSizeCm)}
          onChange={(event) => setTileSizeCm(TILE_SIZES[Number(event.target.value)] ?? 20)}
          className="w-full max-w-md"
          aria-label={t('simulator.tileSize')}
        />
        <div className="flex max-w-md justify-between text-[10px] uppercase tracking-wide text-charcoal-soft">
          <span>{t('simulator.tileSizeLarge')}</span>
          <span>{tileSizeCm} cm</span>
          <span>{t('simulator.tileSizeSmall')}</span>
        </div>
      </div>
      <div>
        <p className="mb-1 text-[11px] uppercase tracking-wide text-charcoal-soft">{t('simulator.layout')}</p>
        <div className="flex flex-wrap gap-1">
          {ROTATIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRotation(value)}
              className={clsx('px-3 py-1.5 text-[11px] uppercase tracking-wide', rotation === value ? 'bg-charcoal text-ivory' : 'border border-charcoal/15')}
            >
              {value}°
            </button>
          ))}
        </div>
      </div>
      <SurfaceCalculator
        surfaceM2={surfaceM2}
        wastePercent={wastePercent}
        requiredM2={estimate.requiredM2}
        tiles={estimate.tiles}
        weightKg={estimate.weightKg}
        total={estimate.total}
        currency={pattern?.currency ?? 'MAD'}
        onSurface={setSurface}
        onWaste={setWaste}
      />
      <Button to={quoteHref} size="lg">{t('simulator.requestQuote')}</Button>
    </div>
  );

  const stepper = (
    <Stepper nonLinear activeStep={STEPS.indexOf(step)} alternativeLabel>
      {STEPS.map((item) => (
        <Step key={item}>
          <StepButton onClick={() => setStep(item)}>{t(`simulator.steps.${item}`)}</StepButton>
        </Step>
      ))}
    </Stepper>
  );

  const nav = (
    <div className="sticky bottom-0 z-10 flex justify-between border-t border-charcoal/10 bg-ivory p-3 lg:hidden">
      <button type="button" className="px-3 py-2 text-sm" onClick={() => setStep(STEPS[Math.max(0, STEPS.indexOf(step) - 1)])}>{t('simulator.back')}</button>
      {step === 'preview' ? (
        <Button to={quoteHref}>{t('simulator.requestQuote')}</Button>
      ) : (
        <button type="button" className="bg-charcoal px-4 py-2 text-sm text-ivory" onClick={() => setStep(STEPS[Math.min(STEPS.length - 1, STEPS.indexOf(step) + 1)])}>{t('simulator.continue')}</button>
      )}
    </div>
  );

  return (
    <>
      <PageMeta title={t('simulator.title')} description={t('simulator.subtitle')} lang={lang} path="/cement-tiles/simulator" />
      <div className="bg-ivory pt-24 md:pt-28">
        <div className="border-b border-charcoal/10 px-4 py-4 md:px-8">
          <h1 className="font-display text-2xl text-charcoal md:text-3xl">{t('simulator.title')}</h1>
          <div className="mt-3 max-w-xl">{stepper}</div>
          <div className="mt-3">{familyTabs}</div>
        </div>

        {tileFamily === 'bjmat' ? (
          <div className="p-6"><BjmatPanel /></div>
        ) : (
          <>
            <div className="hidden h-[calc(100dvh-14rem)] grid-cols-12 gap-px bg-charcoal/10 lg:grid">
              <section className="col-span-5 flex min-h-0 flex-col bg-ivory p-4">
                {mouldBrowser}
              </section>
              <section className="col-span-7 flex min-h-0 flex-col overflow-y-auto bg-ivory p-4">
                {step === 'preview' ? previewPanel : colorPanel}
              </section>
            </div>
            <div className="lg:hidden">
              {step === 'design' ? <div className="h-[70vh] p-4">{mouldBrowser}</div> : null}
              {step === 'colors' ? <div className="flex min-h-[70vh] flex-col p-4">{colorPanel}</div> : null}
              {step === 'preview' ? <div className="p-4 pb-20">{previewPanel}</div> : null}
              {nav}
            </div>
            <DesignUploadDialog
              open={uploadOpen}
              onClose={() => setUploadOpen(false)}
              onAccept={(input) => {
                const mould = addMould(input);
                setPattern(mould.id);
                setUploadOpen(false);
                setStep('colors');
              }}
            />
          </>
        )}
      </div>
    </>
  );
}

function BjmatPanel() {
  const { t } = useTranslation();
  const lang = useLang();
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <p className="max-w-md text-sm text-charcoal-soft/80">{t('simulator.bjmatHint')}</p>
      <div className="flex flex-wrap gap-2">
        <Button to={ROUTES.bjmatLayouts(lang)}>{t('simulator.bjmatLayouts')}</Button>
        <Button to={ROUTES.bjmatColors(lang)}>{t('simulator.bjmatColors')}</Button>
      </div>
    </div>
  );
}

export default CementTileSimulatorPage;
