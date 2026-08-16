using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Patterns;
using MTArt.Catalog.Application.Patterns.Dtos;
using MTArt.Catalog.Application.Patterns.Mapping;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Pagination;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Patterns.Queries.GetCementMoulds;

public sealed record GetCementMouldsQuery(
    string LanguageCode,
    string? CategorySlug = null,
    string? SearchTerm = null,
    int? RegionCount = null,
    bool SimulatorReadyOnly = false,
    int PageNumber = 1,
    int PageSize = 30,
    string? Family = null) : IRequest<Result<PagedResult<TilePatternListItemDto>>>;

public sealed class GetCementMouldsQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetCementMouldsQuery, Result<PagedResult<TilePatternListItemDto>>>
{
    public async Task<Result<PagedResult<TilePatternListItemDto>>> Handle(
        GetCementMouldsQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);

        var query = dbContext.TilePatterns.AsNoTracking()
            .Include(p => p.Translations)
            .Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(request.Family))
        {
            var zelligeIds = await dbContext.PatternCategories.AsNoTracking()
                .Where(c => MouldFamilies.ZelligeCategoryCodes.Contains(c.Code))
                .Select(c => c.Id)
                .ToListAsync(cancellationToken);
            query = request.Family.Equals(MouldFamilies.Zellige, StringComparison.OrdinalIgnoreCase)
                ? query.Where(p => zelligeIds.Contains(p.CategoryId))
                : query.Where(p => !zelligeIds.Contains(p.CategoryId));
        }

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
            var matchingCategoryIds = await dbContext.PatternCategories.AsNoTracking()
                .Where(c => c.Code.Contains(term) || c.Slug.Value.Contains(term.ToLower()) || c.Translations.Any(t => t.Name.Contains(term)))
                .Select(c => c.Id)
                .ToListAsync(cancellationToken);
            query = query.Where(p =>
                p.Reference.Contains(term) ||
                p.Slug.Value.Contains(term.ToLower()) ||
                p.Translations.Any(t => t.Name.Contains(term) || (t.Description != null && t.Description.Contains(term))) ||
                matchingCategoryIds.Contains(p.CategoryId));
        }

        if (!string.IsNullOrWhiteSpace(request.CategorySlug))
        {
            var categoryId = await dbContext.PatternCategories.AsNoTracking()
                .Where(c => c.Slug.Value == request.CategorySlug)
                .Select(c => c.Id)
                .FirstOrDefaultAsync(cancellationToken);
            query = query.Where(p => p.CategoryId == categoryId);
        }

        var total = await query.CountAsync(cancellationToken);
        var patterns = await query
            .OrderBy(p => p.DisplayOrder)
            .ThenBy(p => p.Reference)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var categoryIds = patterns.Select(p => p.CategoryId).Distinct().ToList();
        var categories = await dbContext.PatternCategories.AsNoTracking()
            .Include(c => c.Translations)
            .Where(c => categoryIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, cancellationToken);

        var items = patterns.Select(p =>
        {
            categories.TryGetValue(p.CategoryId, out var category);
            return PatternMapping.ToListItem(p, category!, language);
        }).ToList();

        return Result.Success(new PagedResult<TilePatternListItemDto>(items, pageNumber, pageSize, total));
    }
}
