using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Formats.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Formats.Queries.GetFormats;

public sealed class GetFormatsQueryHandler(ICatalogDbContext dbContext) : IRequestHandler<GetFormatsQuery, Result<IReadOnlyList<FormatDto>>>
{
    public async Task<Result<IReadOnlyList<FormatDto>>> Handle(GetFormatsQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);

        var formats = await dbContext.Formats.AsNoTracking()
            .Include(f => f.Translations)
            .Where(f => !request.ActiveOnly || f.IsActive)
            .Where(f => request.ShapeId == null || f.ShapeId == request.ShapeId)
            .Where(f => request.MaterialType == null || f.MaterialType == request.MaterialType)
            .OrderBy(f => f.DisplayOrder)
            .ToListAsync(cancellationToken);

        var shapeIds = formats.Select(f => f.ShapeId).Distinct().ToList();
        var shapes = await dbContext.Shapes.AsNoTracking().Include(s => s.Translations)
            .Where(s => shapeIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id, cancellationToken);

        var dtos = formats.Select(f =>
        {
            var translation = f.Translations.ForLanguage(language);
            shapes.TryGetValue(f.ShapeId, out var shape);
            var shapeName = shape?.Translations.ForLanguage(language)?.Name ?? shape?.Code ?? string.Empty;

            return new FormatDto(
                f.Id, f.Reference, translation?.Name ?? f.DisplayLabel(), f.WidthCm, f.HeightCm, f.ThicknessCm,
                f.UnitsPerM2, f.WeightPerUnitKg, f.WeightPerM2Kg, f.ShapeId, shapeName, f.DiagramImageId, f.DisplayOrder, f.IsActive,
                f.MaterialType, f.HasVerifiedTechnicalData);
        }).ToList();

        return Result.Success<IReadOnlyList<FormatDto>>(dtos);
    }
}
