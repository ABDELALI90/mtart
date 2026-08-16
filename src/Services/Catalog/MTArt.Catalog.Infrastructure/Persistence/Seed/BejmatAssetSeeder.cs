using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Collections;
using MTArt.Catalog.Domain.Colors;
using MTArt.Catalog.Domain.Formats;
using MTArt.Catalog.Domain.Products;

namespace MTArt.Catalog.Infrastructure.Persistence.Seed;

/// <summary>
/// Imports the real Bjmat / Bejmat photo library from import/products/bejmat.
/// Filenames are WhatsApp captures without catalog references, so temporary BJ-Pxxx IDs
/// are assigned for admin review. Original files are never modified.
/// </summary>
public static class BejmatAssetSeeder
{
    public const string SourceCatalog = "bejmat-whatsapp";

    public static async Task SeedAsync(CatalogDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (await context.Products.IgnoreQueryFilters().AnyAsync(p => p.SourceCatalog == SourceCatalog, cancellationToken))
        {
            logger.LogInformation("Bjmat photo library already imported - skipping.");
            await EnsureFormatsAsync(context, cancellationToken);
            await EnsureFeaturedAsync(context, cancellationToken);
            return;
        }

        await using var stream = typeof(BejmatAssetSeeder).Assembly.GetManifestResourceStream(
            "MTArt.Catalog.Infrastructure.SeedData.bejmat-import.json");
        if (stream is null)
        {
            logger.LogWarning("bejmat-import.json embedded resource was not found.");
            return;
        }

        var payload = await JsonSerializer.DeserializeAsync<BejmatPayload>(stream, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        }, cancellationToken);

        if (payload?.Images is not { Count: > 0 })
        {
            logger.LogWarning("bejmat-import.json contained no images.");
            return;
        }

        var category = await context.Categories.FirstAsync(c => c.Code == "BEJMAT", cancellationToken);
        var square = await context.Shapes.FirstAsync(s => s.Code == "square", cancellationToken);
        var natural = await context.Finishes.FirstAsync(f => f.Code == "natural", cancellationToken);
        var formats = await EnsureFormatsAsync(context, cancellationToken);
        var format15 = formats.First(f => f.Reference == "15x5-bejmat");

        var collection = await EnsureCollectionAsync(context, payload.Images[0].ImageUrl, cancellationToken);
        var colors = await EnsureColorsAsync(context, payload.Images, cancellationToken);
        var colorByCode = colors.ToDictionary(c => c.Code, StringComparer.OrdinalIgnoreCase);

        var products = new List<Product>();
        var order = 0;
        foreach (var item in payload.Images)
        {
            order++;
            var slug = item.ImportId.ToLowerInvariant();
            var kind = item.ImageType.Equals("InstalledProject", StringComparison.OrdinalIgnoreCase)
                ? CatalogPageKind.Project
                : item.ImageType.Equals("FlatSample", StringComparison.OrdinalIgnoreCase)
                    ? CatalogPageKind.ColorSample
                    : CatalogPageKind.Plain;

            var product = Product.Create(item.ImportId, slug, category.Id, order);
            product.UpdateCore(
                item.ImportId, slug, category.Id, collection.Id, square.Id, natural.Id,
                isCustomizable: false,
                minimumOrderM2: 5m,
                unitsPerSquareMeter: format15.UnitsPerM2,
                weightPerSquareMeterKg: null,
                thicknessCm: format15.ThicknessCm,
                countryOfOrigin: "Morocco",
                material: "Handmade terracotta Bjmat",
                productionLeadTime: "4-6 weeks",
                displayOrder: order);
            product.SetPricing(null, "MAD", PriceVisibility.QuoteOnly);
            product.SetCatalogOrigin(kind, SourceCatalog, order);
            if (item.IsFeatured || order <= 8)
            {
                product.SetFeatured(true);
            }

            var familyName = item.DetectedColor;
            product.UpsertTranslation("en", $"Handmade Bjmat {item.ImportId}",
                $"Handmade Moroccan Bjmat. Temporary reference {item.ImportId} pending studio review.",
                "Pressed and fired terracotta with natural variation in tone and edge. Format to be confirmed from the workshop.",
                "Each piece is shaped by hand. Colour and texture vary from tile to tile.",
                "Install over a stable screed with a suitable adhesive. Maintain even joints.",
                "Clean with a pH-neutral cleaner.",
                $"Bjmat {item.ImportId} | MT ART",
                $"Handmade Moroccan Bjmat {item.ImportId} by MT ART.");
            product.UpsertTranslation("fr", $"Bjmat artisanal {item.ImportId}",
                $"Bjmat marocain fait main. Référence temporaire {item.ImportId}.", null, null, null, null, null, null);
            product.UpsertTranslation("es", $"Bjmat artesanal {item.ImportId}",
                $"Bjmat marroquí hecho a mano. Referencia temporal {item.ImportId}.", null, null, null, null, null, null);
            product.UpsertTranslation("ar", $"بجمات يدوي {item.ImportId}",
                $"بجمات مغربي مصنوع يدوياً. مرجع مؤقت {item.ImportId}.", null, null, null, null, null, null);

            product.AddImage(Guid.NewGuid(), ProductImageRole.Primary, 0, item.ImageUrl);

            if (colorByCode.TryGetValue(item.ColorCode, out var color))
            {
                product.AddVariant(color.Id, format15.Id, natural.Id, $"SKU-{item.ImportId}", item.ImportId,
                    StockStatus.MadeToOrder, format15.UnitsPerM2, 0m, format15.ThicknessCm, 5m);
            }

            _ = familyName;
            product.Publish();
            products.Add(product);
        }

        context.Products.AddRange(products);
        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Imported {Count} Bjmat images from {Folder}.", products.Count, payload.SourceFolder);
    }

    private static async Task<Collection> EnsureCollectionAsync(
        CatalogDbContext context, string coverUrl, CancellationToken cancellationToken)
    {
        var existing = await context.Collections.FirstOrDefaultAsync(c => c.Slug.Value == "handmade-bjmat", cancellationToken);
        if (existing is not null)
        {
            if (string.IsNullOrWhiteSpace(existing.CoverImageUrl))
            {
                existing.SetCoverImageUrl(coverUrl);
            }

            return existing;
        }

        var collection = Collection.Create("handmade-bjmat", 20);
        collection.SetCoverImageUrl(coverUrl);
        collection.UpsertTranslation("en", "Handmade Bjmat",
            "Elongated terracotta tiles, laid in straight, brick or herringbone patterns.",
            "A dedicated MT ART Bjmat library photographed in the workshop.", null, null);
        collection.UpsertTranslation("fr", "Bjmat artisanal",
            "Carreaux de terre cuite allongés, posés en lignes, en brique ou en chevron.",
            "Une bibliothèque Bjmat MT ART photographiée à l'atelier.", null, null);
        collection.UpsertTranslation("es", "Bjmat artesanal",
            "Baldosas de terracota alargadas, en hilera, ladrillo o espiga.",
            "Biblioteca Bjmat de MT ART fotografiada en el taller.", null, null);
        collection.UpsertTranslation("ar", "بجمات يدوي",
            "بلاط طيني مستطيل يُركّب بشكل مستقيم أو طوب أو عظم السمكة.",
            "مكتبة بجمات MT ART مصوّرة في الورشة.", null, null);
        context.Collections.Add(collection);
        await context.SaveChangesAsync(cancellationToken);
        return collection;
    }

    private static async Task<List<Color>> EnsureColorsAsync(
        CatalogDbContext context, List<BejmatImage> images, CancellationToken cancellationToken)
    {
        var existing = await context.Colors.Where(c => c.Code.StartsWith("BJ-C")).ToListAsync(cancellationToken);
        if (existing.Count > 0)
        {
            return existing;
        }

        var list = new List<Color>();
        var order = 0;
        foreach (var item in images)
        {
            order++;
            var family = Enum.TryParse<ColorFamily>(item.DetectedColor, true, out var parsed)
                ? parsed
                : ColorFamily.Terracotta;
            var color = Color.Create(item.ColorCode, family, order);
            color.UpdateCore(item.ColorCode, family, item.HexApproximation, null, order);
            color.SetMaterial(MaterialType.Bejmat);
            color.SetPhotography(item.ImageUrl, item.ImageUrl);
            color.SetFeatured(item.IsFeatured);
            color.UpsertTranslation("en", $"Bjmat {item.ColorCode}", "Photographed Bjmat sample. Colour varies from piece to piece.");
            color.UpsertTranslation("fr", $"Bjmat {item.ColorCode}", "Échantillon Bjmat photographié. La couleur varie d'une pièce à l'autre.");
            color.UpsertTranslation("es", $"Bjmat {item.ColorCode}", "Muestra Bjmat fotografiada. El color varía de una pieza a otra.");
            color.UpsertTranslation("ar", $"بجمات {item.ColorCode}", "عينة بجمات مصوّرة. اللون يختلف من قطعة إلى أخرى.");
            list.Add(color);
        }

        context.Colors.AddRange(list);
        await context.SaveChangesAsync(cancellationToken);
        return list;
    }

    private static async Task<List<Format>> EnsureFormatsAsync(CatalogDbContext context, CancellationToken cancellationToken)
    {
        var square = await context.Shapes.FirstAsync(s => s.Code == "square", cancellationToken);
        var formats = await context.Formats.ToListAsync(cancellationToken);

        foreach (var format in formats)
        {
            if (format.Reference.Contains("bejmat", StringComparison.OrdinalIgnoreCase))
            {
                format.SetMaterial(MaterialType.Bejmat);
            }
            else if (format.Reference is "10x10" or "5x5" or "3x3")
            {
                format.SetMaterial(MaterialType.Zellige);
            }
            else
            {
                format.SetMaterial(MaterialType.CementTile);
            }

            format.SetVerifiedTechnicalData(false);
        }

        if (!formats.Any(f => f.Reference == "20x5-bejmat"))
        {
            var extra = Format.Create("20x5-bejmat", 20m, 5m, 1.4m, 100m, 0m, 0m, square.Id, 40);
            extra.SetMaterial(MaterialType.Bejmat);
            extra.SetVerifiedTechnicalData(false);
            extra.UpsertTranslation("en", "20 × 5 cm Bjmat", "Bjmat format. Technical weights available on request.");
            extra.UpsertTranslation("fr", "20 × 5 cm Bjmat", "Format Bjmat. Poids techniques sur demande.");
            extra.UpsertTranslation("es", "20 × 5 cm Bjmat", "Formato Bjmat. Pesos técnicos bajo petición.");
            extra.UpsertTranslation("ar", "20 × 5 سم بجمات", "مقاس بجمات. الأوزان التقنية عند الطلب.");
            context.Formats.Add(extra);
            formats.Add(extra);
        }

        await context.SaveChangesAsync(cancellationToken);
        return formats;
    }

    private static async Task EnsureFeaturedAsync(CatalogDbContext context, CancellationToken cancellationToken)
    {
        var hasFeatured = await context.Products.AnyAsync(
            p => p.SourceCatalog == SourceCatalog && p.IsFeatured, cancellationToken);
        if (hasFeatured)
        {
            return;
        }

        var products = await context.Products
            .Where(p => p.SourceCatalog == SourceCatalog)
            .OrderBy(p => p.DisplayOrder)
            .Take(8)
            .ToListAsync(cancellationToken);
        foreach (var product in products)
        {
            product.SetFeatured(true);
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private sealed class BejmatPayload
    {
        public string SourceFolder { get; set; } = string.Empty;
        public string SourceCatalog { get; set; } = string.Empty;
        public List<BejmatImage> Images { get; set; } = [];
    }

    private sealed class BejmatImage
    {
        public string OriginalFileName { get; set; } = string.Empty;
        public string WebFileName { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string ImportId { get; set; } = string.Empty;
        public string ColorCode { get; set; } = string.Empty;
        public string DetectedColor { get; set; } = "Terracotta";
        public string? SuggestedReference { get; set; }
        public string ImageType { get; set; } = "Variation";
        public string HexApproximation { get; set; } = "#B5623F";
        public bool NeedsReview { get; set; } = true;
        public bool IsFeatured { get; set; }
    }
}
