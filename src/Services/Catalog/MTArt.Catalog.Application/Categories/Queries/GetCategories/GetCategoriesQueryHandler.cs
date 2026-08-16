using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Categories.Dtos;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Categories.Queries.GetCategories;

public sealed class GetCategoriesQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetCategoriesQuery, Result<IReadOnlyList<CategoryDto>>>
{
    public async Task<Result<IReadOnlyList<CategoryDto>>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);

        var categories = await dbContext.Categories.AsNoTracking()
            .Include(c => c.Translations)
            .Where(c => !request.ActiveOnly || c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync(cancellationToken);

        var dtos = categories.Select(c =>
        {
            var translation = c.Translations.ForLanguage(language);
            return new CategoryDto(
                c.Id, c.Code, c.Slug.Value, translation?.Name ?? c.Code, translation?.ShortDescription,
                translation?.Description, c.ImageId, c.DisplayOrder, c.IsActive, translation?.SeoTitle, translation?.SeoDescription);
        }).ToList();

        return Result.Success<IReadOnlyList<CategoryDto>>(dtos);
    }
}
