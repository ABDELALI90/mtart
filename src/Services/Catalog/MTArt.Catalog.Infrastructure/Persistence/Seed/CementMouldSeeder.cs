using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MTArt.Catalog.Domain.Patterns;

namespace MTArt.Catalog.Infrastructure.Persistence.Seed;

/// <summary>
/// Adds original MT ART simulator-ready moulds that were not part of the first catalog import.
/// Skips references that already exist so restarts never duplicate rows.
/// </summary>
public static class CementMouldSeeder
{
    public static async Task SeedAsync(CatalogDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (!await context.PatternCategories.AnyAsync(cancellationToken) || !await context.Colors.AnyAsync(cancellationToken))
        {
            logger.LogInformation("Skipping extra cement moulds — catalog taxonomy is not ready.");
            return;
        }

        var existing = await context.TilePatterns.Select(p => p.Reference).ToListAsync(cancellationToken);
        var existingSet = existing.ToHashSet(StringComparer.OrdinalIgnoreCase);

        var categories = await context.PatternCategories.ToListAsync(cancellationToken);
        Guid Cat(string code) => categories.First(c => c.Code == code).Id;

        var colors = await context.Colors.Where(c => c.IsActive).ToListAsync(cancellationToken);
        Guid Color(string code) => colors.FirstOrDefault(c => c.Code == code)?.Id ?? colors[0].Id;

        var format = await context.Formats.FirstOrDefaultAsync(f => f.Reference == "20x20", cancellationToken);

        var geometric = Cat("geometric");
        var floral = Cat("floral");
        var classic = Cat("classic");
        var borders = Cat("borders");
        var shapes = Cat("shapes");

        var blankUni = await context.TilePatterns.FirstOrDefaultAsync(p => p.Reference == "1010", cancellationToken);
        if (blankUni is { IsActive: true })
        {
            blankUni.SetActive(false);
            await context.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Excluded blank mould 1010 (uni.svg) from the simulator catalogue.");
        }

        var definitions = new (string Reference, string Slug, string Name, Guid CategoryId, string Vector, (string Key, string Label, Guid ColorId)[] Regions)[]
        {
            ("1070", "medallion", "Medallion", classic, "/images/patterns/medallion.svg",
                [("background", "Background", Color("MC27")), ("ring", "Ring", Color("MC18")), ("star", "Star", Color("MC07")), ("center", "Center", Color("MC05"))]),
            ("1072", "garden", "Garden", floral, "/images/patterns/garden.svg",
                [("background", "Background", Color("MC27")), ("petalA", "Petal A", Color("MC07")), ("petalB", "Petal B", Color("MC11")), ("center", "Center", Color("MC18"))]),
            ("1075", "compass", "Compass", geometric, "/images/patterns/compass.svg",
                [("background", "Background", Color("MC27")), ("north", "North", Color("MC18")), ("east", "East", Color("MC07")), ("west", "West", Color("MC11")), ("south", "South", Color("MC05")), ("center", "Center", Color("MC23"))]),
            ("1080", "frame", "Frame", borders, "/images/patterns/frame.svg",
                [("field", "Field", Color("MC27")), ("border", "Border", Color("MC18")), ("inner", "Inner", Color("MC32")), ("corner", "Corner", Color("MC07"))]),
            ("1088", "hexbloom", "Hex Bloom", floral, "/images/patterns/hexbloom.svg",
                [("background", "Background", Color("MC27")), ("hex", "Hexagon", Color("MC11")), ("flower", "Flower", Color("MC07")), ("center", "Center", Color("MC05"))]),
            ("1092", "octostar", "Octostar", geometric, "/images/patterns/octostar.svg",
                [("background", "Background", Color("MC27")), ("octagon", "Octagon", Color("MC18")), ("star", "Star", Color("MC07")), ("center", "Center", Color("MC32"))]),
            ("1095", "pinwheel", "Pinwheel", shapes, "/images/patterns/pinwheel.svg",
                [("background", "Background", Color("MC27")), ("bladeA", "Blade A", Color("MC18")), ("bladeB", "Blade B", Color("MC07")), ("bladeC", "Blade C", Color("MC11")), ("bladeD", "Blade D", Color("MC05")), ("hub", "Hub", Color("MC23"))]),
        };

        var added = 0;
        var display = existing.Count + 20;
        foreach (var def in definitions)
        {
            if (existingSet.Contains(def.Reference))
            {
                continue;
            }

            var mould = TilePattern.Create(def.Reference, def.Slug, def.CategoryId, display++);
            mould.UpdateAssets(def.Vector, def.Vector, format?.Id, true);
            mould.UpsertTranslation("en", def.Name, "Original MT ART cement mould. Each region is coloured independently.");
            mould.UpsertTranslation("fr", def.Name, "Moule ciment original MT ART. Chaque zone se colore indépendamment.");
            mould.UpsertTranslation("es", def.Name, "Molde de cemento original MT ART. Cada zona se colorea de forma independiente.");
            mould.UpsertTranslation("ar", def.Name, "قالب إسمنت أصلي من MT ART. يُلوَّن كل جزء بشكل مستقل.");
            var order = 0;
            foreach (var region in def.Regions)
            {
                mould.AddRegion(region.Key, region.Label, region.ColorId, order++);
            }

            context.TilePatterns.Add(mould);
            added++;
        }

        if (added == 0)
        {
            logger.LogInformation("Cement mould library already complete — skipping extra moulds.");
            return;
        }

        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Added {Count} simulator-ready cement moulds.", added);
    }
}
