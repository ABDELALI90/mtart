using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Colors.Dtos;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Colors.Queries.GetColorBySlug;

public sealed record GetColorBySlugQuery(string Slug, string LanguageCode) : IRequest<Result<ColorDto>>;

public sealed class GetColorBySlugQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetColorBySlugQuery, Result<ColorDto>>
{
    public async Task<Result<ColorDto>> Handle(GetColorBySlugQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);
        var slug = Slug.Create(request.Slug);

        var color = await dbContext.Colors.AsNoTracking()
            .Include(c => c.Translations)
            .FirstOrDefaultAsync(c => c.Slug.Value == slug.Value && !c.IsDemo, cancellationToken);

        if (color is null)
        {
            return Result.Failure<ColorDto>(Error.NotFound("colors.not_found", $"Color '{request.Slug}' was not found."));
        }

        var translation = color.Translations.ForLanguage(language);
        return Result.Success(new ColorDto(
            color.Id, color.Code, color.Slug.Value, translation?.Name ?? color.Code, translation?.Description,
            color.HexApproximation, color.ImageId, color.ImageUrl, color.TextureImageUrl,
            color.Family.ToString(), color.MaterialType.ToString(), color.DisplayOrder, color.IsActive, color.IsFeatured,
            color.Source, color.Rgb));
    }
}
