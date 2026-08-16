using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Colors.Dtos;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Colors.Queries.GetColors;

public sealed class GetColorsQueryHandler(ICatalogDbContext dbContext) : IRequestHandler<GetColorsQuery, Result<IReadOnlyList<ColorDto>>>
{
    public async Task<Result<IReadOnlyList<ColorDto>>> Handle(GetColorsQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);

        var colors = await dbContext.Colors.AsNoTracking()
            .Include(c => c.Translations)
            .Where(c => !request.ActiveOnly || c.IsActive)
            .Where(c => request.IncludeDemo || !c.IsDemo)
            .Where(c => request.Family == null || c.Family == request.Family)
            .Where(c => request.MaterialType == null || c.MaterialType == request.MaterialType || c.MaterialType == MaterialType.Universal)
            .Where(c => string.IsNullOrWhiteSpace(request.Source) || c.Source == request.Source)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync(cancellationToken);

        var dtos = colors.Select(c =>
        {
            var translation = c.Translations.ForLanguage(language);
            return new ColorDto(
                c.Id, c.Code, c.Slug.Value, translation?.Name ?? c.Code, translation?.Description, c.HexApproximation,
                c.ImageId, c.ImageUrl, c.TextureImageUrl, c.Family.ToString(), c.MaterialType.ToString(),
                c.DisplayOrder, c.IsActive, c.IsFeatured, c.Source, c.Rgb);
        }).ToList();

        return Result.Success<IReadOnlyList<ColorDto>>(dtos);
    }
}
