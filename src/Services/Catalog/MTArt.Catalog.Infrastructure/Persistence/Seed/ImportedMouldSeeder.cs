using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MTArt.Catalog.Domain.Patterns;

namespace MTArt.Catalog.Infrastructure.Persistence.Seed;

/// <summary>
/// Seeds photographed Moroccan cement-tile designs from the catalog import.
/// Editable SVG is attached only when a constructed mould template is a reliable match.
/// </summary>
public static class ImportedMouldSeeder
{
    private static readonly (string Code, string En, string Fr, string Es, string Ar)[] ExtraCategories =
    [
        ("arabesque", "Arabesque", "Arabesque", "Arabesco", "أرابسك"),
        ("traditional", "Traditional", "Traditionnel", "Tradicional", "تقليدي"),
        ("patchwork", "Patchwork", "Patchwork", "Patchwork", "باتشورك"),
    ];

    public static async Task SeedAsync(CatalogDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (!await context.PatternCategories.AnyAsync(cancellationToken))
        {
            return;
        }

        await EnsureCategoriesAsync(context, cancellationToken);

        await using var stream = typeof(ImportedMouldSeeder).Assembly.GetManifestResourceStream(
            "MTArt.Catalog.Infrastructure.SeedData.imported-mould-manifest.json");
        if (stream is null)
        {
            logger.LogWarning("imported-mould-manifest.json embedded resource was not found.");
            return;
        }

        var entries = await JsonSerializer.DeserializeAsync<List<ManifestEntry>>(stream, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        }, cancellationToken) ?? [];

        var existing = (await context.TilePatterns.Select(p => p.Reference).ToListAsync(cancellationToken))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var categories = await context.PatternCategories.ToListAsync(cancellationToken);
        var format = await context.Formats.FirstOrDefaultAsync(f => f.Reference == "20x20", cancellationToken);

        var added = 0;
        var display = existing.Count + 200;
        foreach (var entry in entries)
        {
            if (existing.Contains(entry.Reference) || entry.Status == "invalid-source")
            {
                continue;
            }

            var category = categories.FirstOrDefault(c =>
                string.Equals(c.Code, entry.Category, StringComparison.OrdinalIgnoreCase)
                || string.Equals(c.Slug.Value, entry.Category, StringComparison.OrdinalIgnoreCase));
            if (category is null)
            {
                logger.LogWarning("Skipping imported mould {Reference} — category {Category} is missing.", entry.Reference, entry.Category);
                continue;
            }

            var mould = TilePattern.Create(entry.Reference, entry.Slug, category.Id, display++);
            var editable = entry.Editable && !string.IsNullOrWhiteSpace(entry.Svg);
            mould.UpdateAssets(entry.Thumbnail, editable ? entry.Svg : null, format?.Id, true);
            if (!editable)
            {
                mould.SetCustomizable(false);
            }

            var tags = entry.Tags is { Count: > 0 } ? string.Join(", ", entry.Tags) : entry.Category;
            mould.UpsertTranslation("en", entry.Name, $"Imported Moroccan cement-tile design {entry.Reference}. {tags}.");
            mould.UpsertTranslation("fr", entry.Name, $"Motif marocain importé {entry.Reference}.");
            mould.UpsertTranslation("es", entry.Name, $"Diseño marroquí importado {entry.Reference}.");
            mould.UpsertTranslation("ar", entry.Name, $"تصميم مغربي مستورد {entry.Reference}.");

            var order = 0;
            foreach (var region in entry.Regions)
            {
                mould.AddRegion(region.Key, region.Name, null, order++);
            }

            context.TilePatterns.Add(mould);
            existing.Add(entry.Reference);
            added++;
        }

        if (added > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        logger.LogInformation("Imported mould seed complete — added {Count} catalog designs.", added);
    }

    private static async Task EnsureCategoriesAsync(CatalogDbContext context, CancellationToken cancellationToken)
    {
        var existing = await context.PatternCategories.ToListAsync(cancellationToken);
        var order = existing.Count == 0 ? 0 : existing.Max(c => c.DisplayOrder) + 1;
        var added = false;
        foreach (var (code, en, fr, es, ar) in ExtraCategories)
        {
            if (existing.Any(c => string.Equals(c.Code, code, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            var category = PatternCategory.Create(code, code, order++);
            category.UpsertTranslation("en", en);
            category.UpsertTranslation("fr", fr);
            category.UpsertTranslation("es", es);
            category.UpsertTranslation("ar", ar);
            context.PatternCategories.Add(category);
            added = true;
        }

        if (added)
        {
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    private sealed class ManifestEntry
    {
        public string Reference { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Family { get; set; } = "cement";
        public string Category { get; set; } = "traditional";
        public string? Thumbnail { get; set; }
        public string? Svg { get; set; }
        public bool Editable { get; set; }
        public string Status { get; set; } = "needs-vectorization";
        public List<string> Tags { get; set; } = [];
        public List<ManifestRegion> Regions { get; set; } = [];
    }

    private sealed class ManifestRegion
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }
}
