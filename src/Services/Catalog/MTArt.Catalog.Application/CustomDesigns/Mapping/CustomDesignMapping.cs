using MTArt.Catalog.Application.CustomDesigns.Dtos;
using MTArt.Catalog.Domain.CustomDesigns;

namespace MTArt.Catalog.Application.CustomDesigns.Mapping;

public static class CustomDesignMapping
{
    public static CustomTileDesignDto ToDto(CustomTileDesign design) => new(
        design.Id,
        design.Reference,
        design.Name,
        design.WidthCm,
        design.HeightCm,
        design.Unit,
        design.GeometryJson,
        design.SvgMarkup,
        design.ThumbnailSvg,
        design.RepeatMode,
        design.ColorSummaryJson,
        design.SourceMouldId,
        design.CreatedAt,
        design.UpdatedAt);

    public static CustomTileDesignListItemDto ToListItem(CustomTileDesign design) => new(
        design.Id,
        design.Reference,
        design.Name,
        design.WidthCm,
        design.HeightCm,
        design.RepeatMode,
        design.ThumbnailSvg,
        design.ColorSummaryJson,
        design.CreatedAt);
}
