using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Patterns.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Patterns.Queries.GetPatterns;

public sealed record GetPatternsQuery(
    string LanguageCode,
    string? CategorySlug = null,
    string? SearchTerm = null,
    int? RegionCount = null,
    bool SimulatorReadyOnly = false) : IRequest<Result<IReadOnlyList<TilePatternListItemDto>>>;

public sealed class GetPatternsQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetPatternsQuery, Result<IReadOnlyList<TilePatternListItemDto>>>
{
    public async Task<Result<IReadOnlyList<TilePatternListItemDto>>> Handle(GetPatternsQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);

        var query = dbContext.TilePatterns.AsNoTracking()
            .Include(p => p.Translations)
            .Where(p => p.IsActive);

        if (request.SimulatorReadyOnly)
        {
            query = query.Where(p => p.IsSimulatorReady);
        }

        if (request.RegionCount is > 0)
        {
            query = query.Where(p => p.RegionCount == request.RegionCount);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim();
            query = query.Where(p =>
                p.Reference.Contains(term) ||
                p.Translations.Any(t => t.Name.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(request.CategorySlug))
        {
            var categoryId = await dbContext.PatternCategories.AsNoTracking()
                .Where(c => c.Slug.Value == request.CategorySlug)
                .Select(c => c.Id)
                .FirstOrDefaultAsync(cancellationToken);
            query = query.Where(p => p.CategoryId == categoryId);
        }

        var patterns = await query.OrderBy(p => p.DisplayOrder).ToListAsync(cancellationToken);
        var categoryIds = patterns.Select(p => p.CategoryId).Distinct().ToList();
        var categories = await dbContext.PatternCategories.AsNoTracking()
            .Include(c => c.Translations)
            .Where(c => categoryIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, cancellationToken);

        var dtos = patterns.Select(p =>
        {
            categories.TryGetValue(p.CategoryId, out var category);
            return new TilePatternListItemDto(
                p.Id, p.Reference, p.Slug.Value,
                p.Translations.ForLanguage(language)?.Name ?? p.Reference,
                category?.Slug.Value ?? string.Empty,
                category?.Translations.ForLanguage(language)?.Name ?? category?.Code ?? string.Empty,
                p.BasePreviewImageUrl, p.VectorAssetUrl, p.RegionCount, p.IsSimulatorReady, p.IsCustomizable, p.DisplayOrder);
        }).ToList();

        return Result.Success<IReadOnlyList<TilePatternListItemDto>>(dtos);
    }
}
