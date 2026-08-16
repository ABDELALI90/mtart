using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Colors;

namespace MTArt.Catalog.Infrastructure.Persistence.Seed;

/// <summary>
/// Imports Collection UNICOLOR pigment chips extracted from import/colors/*.pdf.
/// Re-runs are idempotent: existing codes are skipped, never duplicated.
/// </summary>
public static class UnicolorColorSeeder
{
    public const string Source = "UNICOLOR";

    public static async Task SeedAsync(CatalogDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        await using var stream = typeof(UnicolorColorSeeder).Assembly.GetManifestResourceStream(
            "MTArt.Catalog.Infrastructure.SeedData.unicolor-import.json");
        if (stream is null)
        {
            logger.LogWarning("unicolor-import.json embedded resource was not found.");
            return;
        }

        var payload = await JsonSerializer.DeserializeAsync<UnicolorPayload>(stream, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        }, cancellationToken);

        if (payload?.Colors is not { Count: > 0 })
        {
            logger.LogWarning("unicolor-import.json contained no colors.");
            return;
        }

        var existing = await context.Colors
            .Include(c => c.Translations)
            .ToListAsync(cancellationToken);
        var byCode = existing.ToDictionary(c => c.Code, StringComparer.OrdinalIgnoreCase);

        var imported = 0;
        var skipped = 0;
        var failed = new List<string>();

        foreach (var item in payload.Colors)
        {
            if (string.IsNullOrWhiteSpace(item.Code))
            {
                failed.Add("(missing code)");
                continue;
            }

            if (!Enum.TryParse<ColorFamily>(item.Family, true, out var family))
            {
                family = ColorFamily.Special;
            }

            if (!int.TryParse(item.Code, out var order))
            {
                order = existing.Count + imported + 1;
            }

            if (byCode.TryGetValue(item.Code, out var existingColor))
            {
                skipped++;
                if (!string.IsNullOrWhiteSpace(existingColor.Source) &&
                    !string.Equals(existingColor.Source, Source, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                existingColor.UpdateCore(item.Code, family, item.Hex, existingColor.ImageId, order);
                existingColor.SetMaterial(MaterialType.CementTile);
                existingColor.SetPhotography(item.ImageUrl, item.ImageUrl);
                existingColor.SetSource(Source, item.Rgb);
                existingColor.SetActive(true);
                UpsertNames(existingColor, item);
                continue;
            }

            try
            {
                var color = Color.Create(item.Code, family, order);
                color.UpdateCore(item.Code, family, item.Hex, null, order);
                color.SetMaterial(MaterialType.CementTile);
                color.SetPhotography(item.ImageUrl, item.ImageUrl);
                color.SetSource(Source, item.Rgb);
                UpsertNames(color, item);
                context.Colors.Add(color);
                byCode[item.Code] = color;
                imported++;
            }
            catch (Exception exception)
            {
                failed.Add($"{item.Code}: {exception.Message}");
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "UNICOLOR colors: detected {Detected}, imported {Imported}, skipped/updated {Skipped}, failed {FailedCount} [{Failed}]",
            payload.Detected, imported, skipped, failed.Count, failed.Count == 0 ? "none" : string.Join(", ", failed));
    }

    private static void UpsertNames(Color color, UnicolorColor item)
    {
        var name = string.IsNullOrWhiteSpace(item.Name) ? item.Code : item.Name;
        const string description =
            "MT ART Collection UNICOLOR. Mineral pigment for handmade cement tiles. Source: UNICOLOR.";
        color.UpsertTranslation("en", name, description);
        color.UpsertTranslation("fr", name, description);
        color.UpsertTranslation("es", name, description);
        color.UpsertTranslation("ar", name, description);
    }

    private sealed class UnicolorPayload
    {
        public int Detected { get; set; }
        public List<UnicolorColor> Colors { get; set; } = [];
    }

    private sealed class UnicolorColor
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Rgb { get; set; } = string.Empty;
        public string Hex { get; set; } = string.Empty;
        public string Family { get; set; } = "Special";
        public string ImageUrl { get; set; } = string.Empty;
        public string Source { get; set; } = UnicolorColorSeeder.Source;
    }
}
