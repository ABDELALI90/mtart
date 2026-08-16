namespace MTArt.Catalog.Application.Patterns.Dtos;

public sealed record PatternCategoryDto(Guid Id, string Code, string Slug, string Name, int DisplayOrder);

public sealed record PatternRegionDto(Guid Id, string RegionKey, string DisplayName, Guid? DefaultColorId, string? DefaultColorCode, int DisplayOrder);

public sealed record TilePatternListItemDto(
    Guid Id, string Reference, string Slug, string Name, string CategorySlug, string CategoryName,
    string? PreviewImageUrl, string? VectorAssetUrl, int RegionCount, bool IsSimulatorReady, bool IsCustomizable, int DisplayOrder);

public sealed record TilePatternDetailDto(
    Guid Id, string Reference, string Slug, string Name, string? Description,
    Guid CategoryId, string CategorySlug, string CategoryName,
    Guid? FormatId, string? FormatLabel,
    string? PreviewImageUrl, string? VectorAssetUrl,
    int RegionCount, bool IsCustomizable, bool IsSimulatorReady,
    IReadOnlyList<PatternRegionDto> Regions,
    decimal? WidthCm = null,
    decimal? HeightCm = null,
    decimal? UnitsPerM2 = null,
    decimal? WeightPerM2Kg = null,
    decimal? PricePerM2 = null,
    string? Currency = null,
    string? PriceVisibility = null);

public sealed record CementMouldRegionInput(string RegionKey, string Name, Guid? DefaultColorId, int DisplayOrder);
