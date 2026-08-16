using MTArt.Catalog.Application.Patterns.Dtos;
using MTArt.Catalog.Domain.Colors;
using MTArt.Catalog.Domain.Formats;
using MTArt.Catalog.Domain.Patterns;
using MTArt.Catalog.Domain.Products;
using MTArt.SharedKernel.Localization;

namespace MTArt.Catalog.Application.Patterns.Mapping;

public static class PatternMapping
{
    public static TilePatternListItemDto ToListItem(
        TilePattern pattern,
        PatternCategory category,
        string language)
    {
        return new TilePatternListItemDto(
            pattern.Id, pattern.Reference, pattern.Slug.Value,
            pattern.Translations.ForLanguage(language)?.Name ?? pattern.Reference,
            category.Slug.Value, category.Translations.ForLanguage(language)?.Name ?? category.Code,
            pattern.BasePreviewImageUrl, pattern.VectorAssetUrl,
            pattern.RegionCount, pattern.IsSimulatorReady, pattern.IsCustomizable, pattern.DisplayOrder);
    }

    public static TilePatternDetailDto ToDetail(
        TilePattern pattern,
        PatternCategory category,
        Format? format,
        Product? pricedProduct,
        IReadOnlyDictionary<Guid, Color> colors,
        string language)
    {
        var translation = pattern.Translations.ForLanguage(language);
        var regions = pattern.Regions.OrderBy(r => r.DisplayOrder).Select(r =>
        {
            colors.TryGetValue(r.DefaultColorId ?? Guid.Empty, out var color);
            return new PatternRegionDto(r.Id, r.RegionKey, r.DisplayName, r.DefaultColorId, color?.Code, r.DisplayOrder);
        }).ToList();

        return new TilePatternDetailDto(
            pattern.Id, pattern.Reference, pattern.Slug.Value,
            translation?.Name ?? pattern.Reference, translation?.Description,
            category.Id, category.Slug.Value, category.Translations.ForLanguage(language)?.Name ?? category.Code,
            pattern.FormatId, format?.DisplayLabel(),
            pattern.BasePreviewImageUrl, pattern.VectorAssetUrl,
            pattern.RegionCount, pattern.IsCustomizable, pattern.IsSimulatorReady,
            regions,
            format?.WidthCm, format?.HeightCm, format?.UnitsPerM2, format?.WeightPerM2Kg,
            pricedProduct?.PricePerM2, pricedProduct?.Currency,
            pricedProduct?.PriceVisibility.ToString());
    }
}
