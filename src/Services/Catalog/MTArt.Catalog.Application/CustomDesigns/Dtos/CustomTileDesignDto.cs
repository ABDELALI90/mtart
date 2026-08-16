namespace MTArt.Catalog.Application.CustomDesigns.Dtos;

public sealed record CustomTileDesignDto(
    Guid Id,
    string Reference,
    string Name,
    decimal WidthCm,
    decimal HeightCm,
    string Unit,
    string GeometryJson,
    string SvgMarkup,
    string? ThumbnailSvg,
    string RepeatMode,
    string? ColorSummaryJson,
    Guid? SourceMouldId,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);

public sealed record CustomTileDesignListItemDto(
    Guid Id,
    string Reference,
    string Name,
    decimal WidthCm,
    decimal HeightCm,
    string RepeatMode,
    string? ThumbnailSvg,
    string? ColorSummaryJson,
    DateTimeOffset CreatedAt);

public sealed record ManufacturingSettingsDto(
    double MinRegionAreaMm2,
    double MinRegionWidthMm,
    double MaxOverlapRatio,
    double MinGapMm);
