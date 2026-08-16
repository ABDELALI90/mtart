using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MTArt.Catalog.Domain.Patterns;

namespace MTArt.Catalog.Infrastructure.Persistence.Seed;

/// <summary>
/// Loads original empty-geometry moulds from the embedded manifest (cement + zellige).
/// Existing references are left untouched so catalog numbers never change.
/// </summary>
public static class MouldLibrarySeeder
{
    public static readonly string[] ZelligeCategoryCodes = ["moroccan", "stars", "rosettes", "moorish"];

    private static readonly (string Code, string En, string Fr, string Es, string Ar)[] ExtraCategories =
    [
        ("moroccan", "Moroccan", "Marocain", "Marroquí", "مغربي"),
        ("stars", "Stars", "Étoiles", "Estrellas", "نجوم"),
        ("rosettes", "Rosettes", "Rosaces", "Rosetones", "ورود"),
        ("moorish", "Moorish", "Mauresque", "Morisco", "أندلسي"),
    ];

    public static async Task SeedAsync(CatalogDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (!await context.PatternCategories.AnyAsync(cancellationToken))
        {
            return;
        }

        await EnsureCategoriesAsync(context, cancellationToken);

        await using var stream = typeof(MouldLibrarySeeder).Assembly.GetManifestResourceStream(
            "MTArt.Catalog.Infrastructure.SeedData.mould-manifest.json");
        if (stream is null)
        {
            logger.LogWarning("mould-manifest.json embedded resource was not found.");
            return;
        }

        var entries = await JsonSerializer.DeserializeAsync<List<ManifestEntry>>(stream, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        }, cancellationToken) ?? [];

        var existing = await context.TilePatterns.Select(p => p.Reference).ToListAsync(cancellationToken);
        var existingSet = existing.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var categories = await context.PatternCategories.ToListAsync(cancellationToken);
        var colors = await context.Colors.Where(c => c.IsActive).ToListAsync(cancellationToken);
        var fallbackColor = colors.FirstOrDefault(c => c.Code == "MC27")?.Id ?? colors.FirstOrDefault()?.Id;
        var format = await context.Formats.FirstOrDefaultAsync(f => f.Reference == "20x20", cancellationToken);

        var added = 0;
        var display = existing.Count + 40;
        foreach (var entry in entries)
        {
            if (existingSet.Contains(entry.Reference))
            {
                continue;
            }

            var category = categories.FirstOrDefault(c =>
                string.Equals(c.Code, entry.Category, StringComparison.OrdinalIgnoreCase)
                || string.Equals(c.Slug.Value, entry.Category, StringComparison.OrdinalIgnoreCase));
            if (category is null)
            {
                logger.LogWarning("Skipping mould {Reference} — category {Category} is missing.", entry.Reference, entry.Category);
                continue;
            }

            var mould = TilePattern.Create(entry.Reference, entry.Slug, category.Id, display++);
            mould.UpdateAssets(entry.Svg, entry.Svg, format?.Id, true);
            mould.UpsertTranslation("en", entry.Name, "Original MT ART mould geometry. Colour each closed region independently.");
            mould.UpsertTranslation("fr", entry.Name, "Géométrie de moule originale MT ART.");
            mould.UpsertTranslation("es", entry.Name, "Geometría de molde original MT ART.");
            mould.UpsertTranslation("ar", entry.Name, "هندسة قالب أصلية من MT ART.");
            var order = 0;
            foreach (var region in entry.Regions)
            {
                mould.AddRegion(region.Key, region.Name, fallbackColor, order++);
            }

            context.TilePatterns.Add(mould);
            existingSet.Add(entry.Reference);
            added++;
        }

        if (added > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        logger.LogInformation("Mould library seed complete — added {Count} empty geometries.", added);
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
        public string Category { get; set; } = "geometric";
        public string Svg { get; set; } = string.Empty;
        public List<ManifestRegion> Regions { get; set; } = [];
    }

    private sealed class ManifestRegion
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }
}
