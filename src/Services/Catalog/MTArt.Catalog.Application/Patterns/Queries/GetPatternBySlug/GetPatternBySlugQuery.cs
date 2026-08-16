using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Patterns.Dtos;
using MTArt.Catalog.Application.Patterns.Mapping;
using MTArt.Catalog.Domain;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Patterns.Queries.GetPatternBySlug;

public sealed record GetPatternBySlugQuery(string Slug, string LanguageCode) : IRequest<Result<TilePatternDetailDto>>;

public sealed class GetPatternBySlugQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetPatternBySlugQuery, Result<TilePatternDetailDto>>
{
    public async Task<Result<TilePatternDetailDto>> Handle(GetPatternBySlugQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);
        var key = request.Slug.Trim();
        var slug = key.ToLowerInvariant();

        var pattern = await dbContext.TilePatterns.AsNoTracking()
            .Include(p => p.Translations)
            .Include(p => p.Regions)
            .FirstOrDefaultAsync(
                p => p.Slug.Value == slug || p.Reference == key || p.Reference == slug,
                cancellationToken);

        if (pattern is null)
        {
            return Result.Failure<TilePatternDetailDto>(Error.NotFound("patterns.not_found", $"Pattern '{request.Slug}' was not found."));
        }

        var category = await dbContext.PatternCategories.AsNoTracking()
            .Include(c => c.Translations)
            .FirstAsync(c => c.Id == pattern.CategoryId, cancellationToken);

        var format = pattern.FormatId.HasValue
            ? await dbContext.Formats.AsNoTracking().FirstOrDefaultAsync(f => f.Id == pattern.FormatId, cancellationToken)
            : null;

        var pricedProduct = await dbContext.Products.AsNoTracking()
            .Where(p => !p.IsDemo && p.PriceVisibility == PriceVisibility.Public && p.PricePerM2 != null)
            .OrderBy(p => p.DisplayOrder)
            .FirstOrDefaultAsync(cancellationToken);

        var colorIds = pattern.Regions.Where(r => r.DefaultColorId.HasValue).Select(r => r.DefaultColorId!.Value).Distinct().ToList();
        var colors = colorIds.Count == 0
            ? new Dictionary<Guid, Domain.Colors.Color>()
            : await dbContext.Colors.AsNoTracking().Where(c => colorIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, cancellationToken);

        return Result.Success(PatternMapping.ToDetail(pattern, category, format, pricedProduct, colors, language));
    }
}
