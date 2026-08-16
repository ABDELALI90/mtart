import type { FormEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ColorModeToggle } from '@/theme/ColorModeToggle';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { apiClient } from '@/services/apiClient';
import type { CatalogImportPage, CatalogImportStatus, Color, Format, PatternCategory, TilePatternListItem } from '@/types/catalog';
import { ROUTES } from '@/utils/paths';
import { catalogImageUrl } from '@/utils/media';
import { createCementMould, fetchCementMould, fetchCementMoulds, fetchMouldCategories, publishCementMould, updateCementMould } from '@/features/simulator/api/simulatorApi';
import { ConfigurableTile } from '@/features/simulator/components/ConfigurableTile';
import { RegionSelector } from '@/features/simulator/components/RegionSelector';
import { CementColorPalette } from '@/features/simulator/components/CementColorPalette';

function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <header className="flex items-center justify-between border-b border-charcoal/10 px-6 py-4">
        <p className="text-xs uppercase tracking-[0.2em]">MT ART Admin</p>
        <nav className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-wide">
          <Link to={ROUTES.adminImport()}>Import</Link>
          <Link to={ROUTES.adminColors()}>Colors</Link>
          <Link to={ROUTES.adminPatterns()}>Patterns</Link>
          <Link to={ROUTES.adminMoulds()}>Moulds</Link>
          <Link to={ROUTES.adminMouldReview()}>Extraction</Link>
          <Link to="/en">Site</Link>
          <ColorModeToggle />
        </nav>
      </header>
      <main className="px-6 py-8">
        <h1 className="mb-8 font-display text-3xl">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function AdminImportPage() {
  const status = useQuery({
    queryKey: ['import-status'],
    queryFn: async () => (await apiClient.get<CatalogImportStatus>('/api/v1/catalog/imports/status')).data,
  });
  const preview = useQuery({
    queryKey: ['import-preview'],
    queryFn: async () => (await apiClient.get<CatalogImportPage[]>('/api/v1/catalog/imports/preview')).data,
  });
  const inventory = useQuery({
    queryKey: ['import-inventory'],
    queryFn: async () => (await apiClient.get<{
      zelligeImages: number; bjmatImages: number; cementTileImages: number;
      zelligeColorSamples: number; cementColors: number; bjmatColorSamples: number;
      catalogReferences: number; mouldCandidates: number; simulatorReady: number; needsReview: number;
    }>('/api/v1/catalog/imports/inventory')).data,
  });
  const data = status.data;

  return (
    <AdminShell title="Catalog import">
      {data ? (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-6">
          <Stat label="Pages scanned" value={data.pageCount} />
          <Stat label="Products" value={data.productsDetected} />
          <Stat label="Projects" value={data.projectsDetected} />
          <Stat label="Unknown" value={data.unknownPages} />
          <Stat label="Imported" value={data.imported} />
          <Stat label="Needs review" value={data.needsReview} />
        </div>
      ) : null}
      {inventory.data ? (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          <Stat label="Zellige images" value={inventory.data.zelligeImages} />
          <Stat label="Bjmat images" value={inventory.data.bjmatImages} />
          <Stat label="Cement tile images" value={inventory.data.cementTileImages} />
          <Stat label="Zellige color samples" value={inventory.data.zelligeColorSamples} />
          <Stat label="Cement colors" value={inventory.data.cementColors} />
          <Stat label="Bjmat color samples" value={inventory.data.bjmatColorSamples} />
          <Stat label="Catalog references" value={inventory.data.catalogReferences} />
          <Stat label="Mould candidates" value={inventory.data.mouldCandidates} />
          <Stat label="Simulator ready" value={inventory.data.simulatorReady} />
          <Stat label="Needs review" value={inventory.data.needsReview} />
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-charcoal-soft">
            <tr>
              <th className="p-2">Page</th>
              <th className="p-2">Image</th>
              <th className="p-2">Category</th>
              <th className="p-2">Name</th>
              <th className="p-2">Reference</th>
              <th className="p-2">Price</th>
              <th className="p-2">Shape</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(preview.data ?? []).map((page) => (
              <tr key={page.id} className="border-t border-charcoal/10">
                <td className="p-2">{page.page}</td>
                <td className="p-2">{page.imageUrl ? <img src={catalogImageUrl(page.imageUrl, { cropped: true }) ?? undefined} alt="" className="h-16 w-16 object-cover" /> : null}</td>
                <td className="p-2">{page.classification}</td>
                <td className="p-2">{page.suggestedName}</td>
                <td className="p-2">{page.suggestedReference}</td>
                <td className="p-2">{page.extractedPrice} {page.priceUnit}</td>
                <td className="p-2">{page.detectedShape}</td>
                <td className="p-2">{page.importedProductId ? 'Imported' : page.needsReview ? 'Review' : page.classification}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

export function AdminColorsPage() {
  const colors = useQuery({
    queryKey: ['admin-colors'],
    queryFn: async () => (await apiClient.get<Color[]>('/api/v1/catalog/colors', { params: { lang: 'en', activeOnly: false } })).data,
  });

  return (
    <AdminShell title="Colors">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        {(colors.data ?? []).map((color) => (
          <article key={color.id} className="border border-charcoal/10 p-3">
            {color.imageUrl ? <img src={catalogImageUrl(color.imageUrl) ?? undefined} alt="" className="mb-2 aspect-square w-full object-cover" /> : <div className="mb-2 aspect-square" style={{ background: color.hexApproximation ?? '#ccc' }} />}
            <p className="text-xs uppercase">{color.code}</p>
            <p className="text-sm">{color.name}</p>
            <p className="text-xs text-charcoal-soft">{color.family} · {color.materialType}</p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}

export function AdminPatternsPage() {
  const patterns = useQuery({
    queryKey: ['admin-patterns'],
    queryFn: async () => (await apiClient.get<TilePatternListItem[]>('/api/v1/catalog/patterns', { params: { lang: 'en' } })).data,
  });

  return (
    <AdminShell title="Patterns">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(patterns.data ?? []).map((pattern) => (
          <article key={pattern.id} className="border border-charcoal/10 p-3">
            {pattern.vectorAssetUrl ? <img src={pattern.vectorAssetUrl} alt={pattern.name} className="mb-2 aspect-square w-full object-contain bg-ivory-dark" /> : null}
            <p className="text-xs uppercase">{pattern.reference}</p>
            <p className="text-sm">{pattern.name}</p>
            <p className="text-xs text-charcoal-soft">{pattern.isSimulatorReady ? 'Simulator-ready' : 'Photograph only'} · {pattern.regionCount} regions</p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}

export function AdminMouldsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | undefined>();
  const [regionColors, setRegionColors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    reference: '',
    slug: '',
    name: '',
    categoryId: '',
    formatId: '',
    previewImageUrl: '',
    vectorAssetUrl: '',
    isSimulatorReady: false,
    isActive: true,
    displayOrder: 0,
    regions: [{ regionKey: 'background', name: 'Background', defaultColorId: '', displayOrder: 0 }],
  });

  const moulds = useQuery({
    queryKey: ['admin-moulds'],
    queryFn: () => fetchCementMoulds({ lang: 'en', page: 1, pageSize: 100, simulatorReady: false }),
  });
  const categories = useQuery({
    queryKey: ['admin-mould-categories'],
    queryFn: () => fetchMouldCategories('en'),
  });
  const colors = useQuery({
    queryKey: ['admin-cement-colors'],
    queryFn: async () => (await apiClient.get<Color[]>('/api/v1/catalog/colors', { params: { lang: 'en', materialType: 'CementTile' } })).data,
  });
  const formats = useQuery({
    queryKey: ['admin-formats'],
    queryFn: async () => (await apiClient.get<Format[]>('/api/v1/catalog/formats', { params: { lang: 'en' } })).data,
  });

  const items = moulds.data?.items ?? [];
  const selected = items.find((item) => item.id === selectedId);

  async function loadMould(item: TilePatternListItem) {
    const detail = await fetchCementMould(item.reference, 'en');
    setSelectedId(item.id);
    setForm({
      reference: detail.reference,
      slug: detail.slug,
      name: detail.name,
      categoryId: detail.categoryId,
      formatId: detail.formatId ?? '',
      previewImageUrl: detail.previewImageUrl ?? '',
      vectorAssetUrl: detail.vectorAssetUrl ?? '',
      isSimulatorReady: detail.isSimulatorReady,
      isActive: true,
      displayOrder: item.displayOrder,
      regions: detail.regions.map((region) => ({
        regionKey: region.regionKey,
        name: region.displayName,
        defaultColorId: region.defaultColorId ?? '',
        displayOrder: region.displayOrder,
      })),
    });
    const defaults: Record<string, string> = {};
    detail.regions.forEach((region) => {
      defaults[region.regionKey] = region.defaultColorCode ?? 'MC27';
    });
    setRegionColors(defaults);
    setActiveRegion(detail.regions[0]?.regionKey);
  }

  const save = useMutation({
    mutationFn: async () => {
      const regions = form.regions.map((region, index) => ({
        regionKey: region.regionKey,
        name: region.name,
        defaultColorId: region.defaultColorId || null,
        displayOrder: index,
      }));
      if (selectedId && selectedId !== 'new') {
        await updateCementMould(selectedId, {
          ...form,
          formatId: form.formatId || null,
          previewImageUrl: form.previewImageUrl || null,
          vectorAssetUrl: form.vectorAssetUrl || null,
          regions,
        });
      } else {
        await createCementMould({
          ...form,
          formatId: form.formatId || null,
          previewImageUrl: form.previewImageUrl || null,
          vectorAssetUrl: form.vectorAssetUrl || null,
          regions,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-moulds'] }),
  });

  const publish = useMutation({
    mutationFn: async () => {
      if (!selectedId || selectedId === 'new') {
        return;
      }
      await publishCementMould(selectedId, true, true);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-moulds'] }),
  });

  const previewRegions = useMemo(
    () => form.regions.map((region, index) => ({
      id: region.regionKey,
      regionKey: region.regionKey,
      displayName: region.name,
      defaultColorId: region.defaultColorId || null,
      defaultColorCode: regionColors[region.regionKey] ?? null,
      displayOrder: index,
    })),
    [form.regions, regionColors],
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void save.mutateAsync();
  }

  return (
    <AdminShell title="Cement moulds">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <button
            type="button"
            className="mb-3 w-full border border-charcoal/20 px-3 py-2 text-xs uppercase tracking-wide"
            onClick={() => {
              setSelectedId('new');
              setForm({
                reference: '',
                slug: '',
                name: '',
                categoryId: categories.data?.[0]?.id ?? '',
                formatId: '',
                previewImageUrl: '',
                vectorAssetUrl: '',
                isSimulatorReady: false,
                isActive: true,
                displayOrder: items.length,
                regions: [{ regionKey: 'background', name: 'Background', defaultColorId: '', displayOrder: 0 }],
              });
            }}
          >
            Create mould
          </button>
          <div className="grid gap-2">
            {items.map((item) => (
              <button key={item.id} type="button" onClick={() => void loadMould(item)} className={`border p-2 text-left ${selectedId === item.id ? 'border-petrol' : 'border-charcoal/10'}`}>
                <p className="text-xs uppercase">{item.reference}</p>
                <p className="text-sm">{item.name}</p>
                <p className="text-[10px] text-charcoal-soft">{item.isSimulatorReady ? 'Simulator-ready' : 'Needs SVG/masks'} · {item.regionCount} regions</p>
              </button>
            ))}
          </div>
        </aside>
        {selectedId ? (
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <TextField size="small" label="Reference" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} required />
              <TextField size="small" label="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
              <TextField size="small" label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              <TextField size="small" select label="Category" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                {(categories.data ?? []).map((category: PatternCategory) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
              </TextField>
              <TextField size="small" select label="Format" value={form.formatId} onChange={(event) => setForm({ ...form, formatId: event.target.value })}>
                <MenuItem value="">None</MenuItem>
                {(formats.data ?? []).map((format) => <MenuItem key={format.id} value={format.id}>{format.reference}</MenuItem>)}
              </TextField>
              <TextField size="small" label="SVG URL" value={form.vectorAssetUrl} onChange={(event) => setForm({ ...form, vectorAssetUrl: event.target.value, previewImageUrl: event.target.value })} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide">Regions</p>
                <button type="button" className="text-xs uppercase" onClick={() => setForm({ ...form, regions: [...form.regions, { regionKey: `region${form.regions.length + 1}`, name: `Region ${form.regions.length + 1}`, defaultColorId: '', displayOrder: form.regions.length }] })}>Add region</button>
              </div>
              {form.regions.map((region, index) => (
                <div key={index} className="mb-2 grid grid-cols-3 gap-2">
                  <TextField size="small" label="Key" value={region.regionKey} onChange={(event) => {
                    const regions = [...form.regions];
                    regions[index] = { ...region, regionKey: event.target.value };
                    setForm({ ...form, regions });
                  }} />
                  <TextField size="small" label="Label" value={region.name} onChange={(event) => {
                    const regions = [...form.regions];
                    regions[index] = { ...region, name: event.target.value };
                    setForm({ ...form, regions });
                  }} />
                  <TextField size="small" select label="Default color" value={region.defaultColorId} onChange={(event) => {
                    const regions = [...form.regions];
                    regions[index] = { ...region, defaultColorId: event.target.value };
                    setForm({ ...form, regions });
                  }}>
                    <MenuItem value="">None</MenuItem>
                    {(colors.data ?? []).map((color) => <MenuItem key={color.id} value={color.id}>{color.code}</MenuItem>)}
                  </TextField>
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide">Live test</p>
                {form.vectorAssetUrl ? (
                  <ConfigurableTile
                    src={form.vectorAssetUrl}
                    regionColors={regionColors}
                    colors={colors.data ?? []}
                    activeRegion={activeRegion}
                    onRegionClick={setActiveRegion}
                    className="aspect-square border border-charcoal/10 [&_svg]:h-full [&_svg]:w-full"
                  />
                ) : <div className="aspect-square bg-ivory-dark" />}
              </div>
              <div>
                <RegionSelector regions={previewRegions} activeRegion={activeRegion} regionColors={regionColors} onSelect={setActiveRegion} />
                <div className="mt-3 max-h-64 overflow-y-auto">
                  <CementColorPalette colors={colors.data ?? []} selectedCode={activeRegion ? regionColors[activeRegion] : undefined} onSelect={(code) => activeRegion && setRegionColors((current) => ({ ...current, [activeRegion]: code }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-charcoal px-4 py-2 text-sm text-ivory">{save.isPending ? 'Saving…' : 'Save'}</button>
              <button type="button" className="border border-charcoal/20 px-4 py-2 text-sm" onClick={() => publish.mutate()} disabled={!selected || !form.vectorAssetUrl || form.regions.length === 0}>
                Publish
              </button>
              {selected ? <p className="self-center text-xs text-charcoal-soft">{selected.isSimulatorReady ? 'Currently published' : 'Unpublished — needs valid SVG and regions'}</p> : null}
            </div>
          </form>
        ) : <p className="text-sm text-charcoal-soft">Select a mould or create one. Only moulds with SVG regions should be marked simulator-ready.</p>}
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-charcoal/10 p-4">
      <p className="text-[10px] uppercase tracking-wide text-charcoal-soft">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}
