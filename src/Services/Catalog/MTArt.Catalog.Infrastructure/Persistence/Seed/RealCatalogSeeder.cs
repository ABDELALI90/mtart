using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Categories;
using MTArt.Catalog.Domain.Collections;
using MTArt.Catalog.Domain.Colors;
using MTArt.Catalog.Domain.Formats;
using MTArt.Catalog.Domain.Imports;
using MTArt.Catalog.Domain.Patterns;
using MTArt.Catalog.Domain.Products;
using MTArt.Catalog.Domain.Shapes;

namespace MTArt.Catalog.Infrastructure.Persistence.Seed;

/// <summary>
/// Imports the real MT ART cement-tile catalog extracted from import/catalogs/catalog_with_price.pdf.
/// Demo seed records are marked IsDemo and hidden from the public API.
/// </summary>
public static class RealCatalogSeeder
{
    public static async Task SeedAsync(CatalogDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (await context.Products.IgnoreQueryFilters().AnyAsync(p => p.SourceCatalog != null, cancellationToken))
        {
            logger.LogInformation("Real catalog already imported - skipping.");
            return;
        }

        await using var stream = typeof(RealCatalogSeeder).Assembly.GetManifestResourceStream(
            "MTArt.Catalog.Infrastructure.SeedData.catalog-import.json");
        if (stream is null)
        {
            logger.LogWarning("catalog-import.json embedded resource was not found.");
            return;
        }

        var payload = await JsonSerializer.DeserializeAsync<ImportPayload>(stream, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        }, cancellationToken);

        if (payload is null)
        {
            logger.LogWarning("catalog-import.json could not be parsed.");
            return;
        }

        await MarkExistingDemoAsync(context, cancellationToken);

        var cement = await context.Categories.FirstAsync(c => c.Code == "CEMENT", cancellationToken);
        var square = await context.Shapes.FirstAsync(s => s.Code == "square", cancellationToken);
        var hexagon = await context.Shapes.FirstAsync(s => s.Code == "hexagon", cancellationToken);
        var matte = await context.Finishes.FirstAsync(f => f.Code == "matte", cancellationToken);

        var format20 = await EnsureFormat20Async(context, square, cancellationToken);
        var collections = await EnsureCollectionsAsync(context, cancellationToken);
        var colors = await EnsureColorsAsync(context, payload.Colors, cancellationToken);
        var patterns = await EnsurePatternsAsync(context, colors, format20, cancellationToken);

        var colorByCode = colors.ToDictionary(c => c.Code, StringComparer.OrdinalIgnoreCase);
        var defaultColor = colors[0];

        var products = new List<Product>();
        foreach (var item in payload.Products)
        {
            var kind = Enum.TryParse<CatalogPageKind>(item.Kind, true, out var parsedKind)
                ? parsedKind
                : CatalogPageKind.Patterned;
            var shapeId = item.Shape == "hexagon" ? hexagon.Id : square.Id;
            var collection = PickCollection(collections, kind, item.Page);
            var slug = item.ImportId.ToLowerInvariant();
            var product = Product.Create(item.ImportId, slug, cement.Id, item.Page);
            product.UpdateCore(
                item.ImportId, slug, cement.Id, collection.Id, shapeId, matte.Id,
                isCustomizable: item.IsSimulatorReady,
                minimumOrderM2: 5m,
                unitsPerSquareMeter: format20.UnitsPerM2,
                weightPerSquareMeterKg: format20.WeightPerM2Kg,
                thicknessCm: format20.ThicknessCm,
                countryOfOrigin: "Morocco",
                material: "White cement, marble powder, mineral pigments",
                productionLeadTime: "4-6 weeks",
                displayOrder: item.Page);
            product.SetPricing(item.PriceDhPerM2, "MAD", PriceVisibility.Public);
            product.SetCatalogOrigin(kind, payload.SourceCatalog, item.Page);
            if (item.IsFeatured)
            {
                product.SetFeatured(true);
            }

            var names = item.Names;
            product.UpsertTranslation("en", names.En, $"{names.En}. Handmade cement tile from MT ART, Meknes.",
                "Pressed by hand in Meknes from white cement, marble powder and mineral pigments. Natural variation in pigment and pattern alignment is part of the craft.",
                "Hand-pressed in steel moulds, cured, then waxed. Each tile is a unique impression of the artisan's work.",
                "Install over a stable, level screed with a suitable cement-tile adhesive. Maintain 1.5–2 mm joints. Seal after installation.",
                "Clean with a pH-neutral cleaner. Do not use acids or abrasives on sealed cement tiles.",
                $"{names.En} | MT ART",
                $"Handmade Moroccan cement tile {item.ImportId} by MT ART.");
            product.UpsertTranslation("fr", names.Fr, $"{names.Fr}. Carreau de ciment artisanal MT ART, Meknès.", null, null, null, null, null, null);
            product.UpsertTranslation("es", names.Es, $"{names.Es}. Baldosa de cemento artesanal MT ART, Meknes.", null, null, null, null, null, null);
            product.UpsertTranslation("ar", names.Ar, $"{names.Ar}. بلاط إسمنتي مصنوع يدويًا في مكناس.", null, null, null, null, null, null);

            var imageId = Guid.NewGuid();
            product.AddImage(imageId, ProductImageRole.Primary, 0, item.ImageUrl);

            var linkedPattern = MatchPattern(patterns, item.Page);
            if (linkedPattern is not null)
            {
                product.SetSimulatorReady(true, linkedPattern.Id);
            }

            var color = PickColor(colorByCode, item.DominantColors, defaultColor);
            product.AddVariant(color.Id, format20.Id, matte.Id, $"SKU-{item.ImportId}", item.ImportId,
                StockStatus.MadeToOrder, format20.UnitsPerM2, format20.WeightPerM2Kg, format20.ThicknessCm, 5m);
            product.Publish();
            products.Add(product);
        }

        context.Products.AddRange(products);

        var session = CatalogImportSession.Create(payload.SourceCatalog);
        var pages = payload.Pages.Select(page =>
        {
            var record = CatalogImportPage.Create(session.Id, page.Page, page.ImportId);
            var kind = Enum.TryParse<CatalogPageKind>(page.Kind, true, out var parsed) ? parsed : CatalogPageKind.Unknown;
            record.ApplyAnalysis(
                kind, page.Names.En, page.ImportId, "cement-tiles", page.Shape,
                page.PriceDhPerM2, page.PriceUnit, page.ImageUrl,
                page.DominantColors is { Count: > 0 } ? string.Join(",", page.DominantColors) : null,
                page.Classification == "Unknown" ? 0.4 : 0.82,
                page.Classification is "Unknown" or "Marketing");
            var imported = products.FirstOrDefault(p => p.Reference == page.ImportId);
            if (imported is not null)
            {
                record.MarkImported(imported.Id);
            }

            return record;
        }).ToList();
        session.ReplacePages(pages);
        session.Confirm(products.Count);
        context.CatalogImportSessions.Add(session);

        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "Imported {Products} real catalog products, {Colors} cement colors, {Patterns} simulator patterns from {Pages} analyzed pages.",
            products.Count, colors.Count, patterns.Count, payload.PageCount);
    }

    private static async Task MarkExistingDemoAsync(CatalogDbContext context, CancellationToken cancellationToken)
    {
        foreach (var product in await context.Products.ToListAsync(cancellationToken))
        {
            product.MarkAsDemo();
        }

        foreach (var color in await context.Colors.ToListAsync(cancellationToken))
        {
            color.MarkAsDemo();
        }

        foreach (var collection in await context.Collections.ToListAsync(cancellationToken))
        {
            collection.MarkAsDemo();
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private static async Task<Format> EnsureFormat20Async(CatalogDbContext context, Shape square, CancellationToken cancellationToken)
    {
        var existing = await context.Formats.FirstOrDefaultAsync(f => f.Reference == "20x20", cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var format = Format.Create("20x20", 20m, 20m, 1.6m, 25m, 0.72m, 18m, square.Id, 10);
        format.UpsertTranslation("en", "20 x 20 cm", "Standard cement tile format.");
        format.UpsertTranslation("fr", "20 x 20 cm", null);
        format.UpsertTranslation("es", "20 x 20 cm", null);
        format.UpsertTranslation("ar", "20 × 20 سم", null);
        context.Formats.Add(format);
        await context.SaveChangesAsync(cancellationToken);
        return format;
    }

    private static async Task<List<Collection>> EnsureCollectionsAsync(CatalogDbContext context, CancellationToken cancellationToken)
    {
        var definitions = new[]
        {
            ("geometric-stars", "Geometric Stars", "Étoiles géométriques", "Estrellas geométricas", "نجوم هندسية", "/images/catalog/p009.webp"),
            ("traditional-floral", "Traditional Floral", "Floral traditionnel", "Floral tradicional", "زهور تقليدية", "/images/catalog/p022.webp"),
            ("installed-projects", "Installed Projects", "Projets réalisés", "Proyectos instalados", "مشاريع منفذة", "/images/catalog/p069.webp"),
            ("patchwork", "Patchwork", "Patchwork", "Patchwork", "باتشورك", "/images/catalog/p020.webp"),
            ("borders", "Borders & Frames", "Bordures et cadres", "Cenefas y marcos", "إطارات وحواف", "/images/catalog/p180.webp"),
        };

        var list = new List<Collection>();
        var order = 10;
        foreach (var (slug, en, fr, es, ar, cover) in definitions)
        {
            var collection = Collection.Create(slug, order++);
            collection.SetCoverImageUrl(cover);
            collection.UpsertTranslation("en", en, $"A curated MT ART grouping of {en.ToLowerInvariant()}.", null, $"{en} | MT ART", null);
            collection.UpsertTranslation("fr", fr, null, null, null, null);
            collection.UpsertTranslation("es", es, null, null, null, null);
            collection.UpsertTranslation("ar", ar, null, null, null, null);
            list.Add(collection);
        }

        context.Collections.AddRange(list);
        await context.SaveChangesAsync(cancellationToken);
        return list;
    }

    private static async Task<List<Color>> EnsureColorsAsync(CatalogDbContext context, List<ColorPayload> payload, CancellationToken cancellationToken)
    {
        var list = new List<Color>();
        var order = 100;
        foreach (var item in payload)
        {
            if (!Enum.TryParse<ColorFamily>(item.Family, true, out var family))
            {
                family = ColorFamily.Special;
            }

            var color = Color.Create(item.Code, family, order++);
            color.UpdateCore(item.Code, family, item.Hex, null, color.DisplayOrder);
            color.SetMaterial(MaterialType.CementTile);
            color.SetPhotography(item.ImageUrl, item.ImageUrl);
            color.SetFeatured(item.IsFeatured);
            color.UpsertTranslation("en", item.Names.En, "Handmade cement-tile pigment. Photograph shows natural surface variation.");
            color.UpsertTranslation("fr", item.Names.Fr, "Pigment de carreau de ciment. La photo montre la variation naturelle.");
            color.UpsertTranslation("es", item.Names.Es, "Pigmento de baldosa de cemento. La foto muestra la variación natural.");
            color.UpsertTranslation("ar", item.Names.Ar, "صبغة بلاط إسمنتي يدوي. الصورة تُظهر التباين الطبيعي.");
            list.Add(color);
        }

        context.Colors.AddRange(list);
        await context.SaveChangesAsync(cancellationToken);
        return list;
    }

    private static async Task<List<TilePattern>> EnsurePatternsAsync(
        CatalogDbContext context, List<Color> colors, Format format, CancellationToken cancellationToken)
    {
        var categories = new (string Code, string Slug, string En, string Fr, string Es, string Ar)[]
        {
            ("traditional", "traditional", "Traditional", "Traditionnel", "Tradicional", "تقليدي"),
            ("geometric", "geometric", "Geometric", "Géométrique", "Geométrico", "هندسي"),
            ("floral", "floral", "Floral", "Floral", "Floral", "زهري"),
            ("modern", "modern", "Modern", "Moderne", "Moderno", "حديث"),
            ("classic", "classic", "Classic", "Classique", "Clásico", "كلاسيكي"),
            ("borders", "borders", "Borders", "Bordures", "Cenefas", "حواف"),
            ("patchwork", "patchwork", "Patchwork", "Patchwork", "Patchwork", "باتشورك"),
            ("monochrome", "monochrome", "Monochrome", "Monochrome", "Monocromo", "أحادي اللون"),
            ("custom", "custom", "Custom", "Sur mesure", "A medida", "مخصص"),
            ("shapes", "shapes-sizes", "Shapes & Sizes", "Formes et formats", "Formas y tamaños", "أشكال ومقاسات"),
        };

        var categoryEntities = new List<PatternCategory>();
        var order = 0;
        foreach (var (code, slug, en, fr, es, ar) in categories)
        {
            var category = PatternCategory.Create(code, slug, order++);
            category.UpsertTranslation("en", en);
            category.UpsertTranslation("fr", fr);
            category.UpsertTranslation("es", es);
            category.UpsertTranslation("ar", ar);
            categoryEntities.Add(category);
        }

        context.PatternCategories.AddRange(categoryEntities);
        await context.SaveChangesAsync(cancellationToken);

        var geometric = categoryEntities.First(c => c.Code == "geometric").Id;
        var traditional = categoryEntities.First(c => c.Code == "traditional").Id;
        var floral = categoryEntities.First(c => c.Code == "floral").Id;
        var modern = categoryEntities.First(c => c.Code == "modern").Id;
        var classic = categoryEntities.First(c => c.Code == "classic").Id;

        var white = colors.First(c => c.Code == "MC27");
        var navy = colors.First(c => c.Code == "MC18");
        var terracotta = colors.First(c => c.Code == "MC07");
        var sage = colors.First(c => c.Code == "MC11");
        var black = colors.First(c => c.Code == "MC23");
        var mustard = colors.First(c => c.Code == "MC05");

        var definitions = new[]
        {
            new PatternDef("1025", "najma", "Najma", geometric, "/images/patterns/najma.svg",
                [("background", "Background", white.Id), ("main", "Star", navy.Id)]),
            new PatternDef("1026", "arabia", "Arabia", traditional, "/images/patterns/arabia.svg",
                [("background", "Background", white.Id), ("main", "Motif", terracotta.Id), ("accent", "Accent", navy.Id)]),
            new PatternDef("1027", "rif", "Rif", floral, "/images/patterns/rif.svg",
                [("background", "Background", white.Id), ("main", "Petal", sage.Id), ("secondary", "Center", mustard.Id)]),
            new PatternDef("1035", "cube", "Cube", modern, "/images/patterns/cube.svg",
                [("light", "Light face", white.Id), ("mid", "Mid face", sage.Id), ("dark", "Dark face", black.Id)]),
            new PatternDef("1040", "quatrefoil", "Quatrefoil", classic, "/images/patterns/quatrefoil.svg",
                [("background", "Background", white.Id), ("main", "Quatrefoil", navy.Id), ("accent", "Diamond", terracotta.Id)]),
            new PatternDef("1042", "diamond", "Diamond Lattice", geometric, "/images/patterns/diamond.svg",
                [("background", "Background", white.Id), ("main", "Lattice", black.Id)]),
            new PatternDef("1048", "scroll", "Scroll", traditional, "/images/patterns/scroll.svg",
                [("background", "Background", white.Id), ("main", "Scroll", navy.Id), ("secondary", "Fill", sage.Id)]),
            new PatternDef("1050", "checker", "Checker", modern, "/images/patterns/checker.svg",
                [("a", "Field A", white.Id), ("b", "Field B", black.Id)]),
            new PatternDef("1055", "petal", "Petal Circle", floral, "/images/patterns/petal.svg",
                [("background", "Background", white.Id), ("main", "Petal", terracotta.Id), ("accent", "Center", navy.Id)]),
            new PatternDef("1060", "cabochon", "Cabochon", classic, "/images/patterns/cabochon.svg",
                [("field", "Field", white.Id), ("cabochon", "Cabochon", black.Id)]),
            new PatternDef("1068", "concentric", "Concentric", geometric, "/images/patterns/concentric.svg",
                [("outer", "Outer", white.Id), ("ring", "Ring", navy.Id), ("center", "Center", terracotta.Id)]),
        };

        var patterns = new List<TilePattern>();
        var display = 0;
        foreach (var def in definitions)
        {
            var pattern = TilePattern.Create(def.Reference, def.Slug, def.CategoryId, display++);
            pattern.UpdateAssets($"/images/patterns/{def.Slug}.svg", def.VectorUrl, format.Id, true);
            pattern.UpsertTranslation("en", def.Name, "Original MT ART simulator pattern. Recolor each region independently.");
            pattern.UpsertTranslation("fr", def.Name, "Motif simulateur original MT ART.");
            pattern.UpsertTranslation("es", def.Name, "Motivo original del simulador MT ART.");
            pattern.UpsertTranslation("ar", def.Name, "نمط محاكي أصلي من MT ART.");
            var regionOrder = 0;
            foreach (var (key, label, colorId) in def.Regions)
            {
                pattern.AddRegion(key, label, colorId, regionOrder++);
            }

            patterns.Add(pattern);
        }

        context.TilePatterns.AddRange(patterns);
        await context.SaveChangesAsync(cancellationToken);
        return patterns;
    }

    private static Collection PickCollection(List<Collection> collections, CatalogPageKind kind, int page) =>
        kind switch
        {
            CatalogPageKind.Patchwork => collections.First(c => c.Slug.Value == "patchwork"),
            CatalogPageKind.Border => collections.First(c => c.Slug.Value == "borders"),
            CatalogPageKind.Project => collections.First(c => c.Slug.Value == "installed-projects"),
            CatalogPageKind.Plain => collections.First(c => c.Slug.Value == "geometric-stars"),
            _ => page is >= 9 and <= 16 or >= 21 and <= 32
                ? collections.First(c => c.Slug.Value == "geometric-stars")
                : collections.First(c => c.Slug.Value == "traditional-floral"),
        };

    private static TilePattern? MatchPattern(List<TilePattern> patterns, int page) =>
        page switch
        {
            6 or 9 or 13 or 14 or 15 or 23 or 27 or 60 => patterns.First(p => p.Reference == "1025"),
            35 or 37 or 39 => patterns.First(p => p.Reference == "1035"),
            _ => null,
        };

    private static Color PickColor(Dictionary<string, Color> colors, List<string> dominant, Color fallback)
    {
        if (dominant.Count == 0)
        {
            return fallback;
        }

        var hex = dominant[0].Trim('#');
        if (hex.Length != 6)
        {
            return fallback;
        }

        var r = Convert.ToInt32(hex[..2], 16);
        var g = Convert.ToInt32(hex.Substring(2, 2), 16);
        var b = Convert.ToInt32(hex.Substring(4, 2), 16);
        Color? best = null;
        var bestDistance = int.MaxValue;
        foreach (var color in colors.Values)
        {
            if (string.IsNullOrWhiteSpace(color.HexApproximation) || color.HexApproximation.Length < 7)
            {
                continue;
            }

            var ch = color.HexApproximation.TrimStart('#');
            var cr = Convert.ToInt32(ch[..2], 16);
            var cg = Convert.ToInt32(ch.Substring(2, 2), 16);
            var cb = Convert.ToInt32(ch.Substring(4, 2), 16);
            var distance = Math.Abs(r - cr) + Math.Abs(g - cg) + Math.Abs(b - cb);
            if (distance < bestDistance)
            {
                bestDistance = distance;
                best = color;
            }
        }

        return best ?? fallback;
    }

    private sealed record ImportPayload(string SourceCatalog, int PageCount, List<PagePayload> Pages, List<ColorPayload> Colors, List<PagePayload> Products);
    private sealed record PagePayload(
        int Page, string ImportId, string Classification, string Kind, string Shape,
        decimal? PriceDhPerM2, string? PriceUnit, string ImageUrl, List<string> DominantColors,
        bool IsSimulatorReady, bool IsFeatured, NamePayload Names);
    private sealed record ColorPayload(string Code, string Family, string Hex, string ImageUrl, string MaterialType, bool IsFeatured, NamePayload Names);
    private sealed record NamePayload(string En, string Fr, string Es, string Ar);
    private sealed record PatternDef(string Reference, string Slug, string Name, Guid CategoryId, string VectorUrl, (string Key, string Label, Guid ColorId)[] Regions);
}
