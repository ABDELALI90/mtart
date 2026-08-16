using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Patterns.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Patterns.Queries.GetPatternCategories;

public sealed record GetPatternCategoriesQuery(string LanguageCode) : IRequest<Result<IReadOnlyList<PatternCategoryDto>>>;

public sealed class GetPatternCategoriesQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetPatternCategoriesQuery, Result<IReadOnlyList<PatternCategoryDto>>>
{
    public async Task<Result<IReadOnlyList<PatternCategoryDto>>> Handle(GetPatternCategoriesQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);
        var items = await dbContext.PatternCategories.AsNoTracking()
            .Include(c => c.Translations)
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(c => new PatternCategoryDto(
            c.Id, c.Code, c.Slug.Value,
            c.Translations.ForLanguage(language)?.Name ?? c.Code,
            c.DisplayOrder)).ToList();

        return Result.Success<IReadOnlyList<PatternCategoryDto>>(dtos);
    }
}
