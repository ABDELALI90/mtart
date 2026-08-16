using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Categories.Dtos;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Categories.Queries.GetCategoryBySlug;

public sealed class GetCategoryBySlugQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetCategoryBySlugQuery, Result<CategoryDto>>
{
    public async Task<Result<CategoryDto>> Handle(GetCategoryBySlugQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);
        var slug = Slug.Create(request.Slug);

        var category = await dbContext.Categories.AsNoTracking()
            .Include(c => c.Translations)
            .FirstOrDefaultAsync(c => c.Slug.Value == slug.Value, cancellationToken);

        if (category is null)
        {
            return Result.Failure<CategoryDto>(Error.NotFound("categories.not_found", $"Category '{request.Slug}' was not found."));
        }

        var translation = category.Translations.ForLanguage(language);
        var dto = new CategoryDto(
            category.Id, category.Code, category.Slug.Value, translation?.Name ?? category.Code, translation?.ShortDescription,
            translation?.Description, category.ImageId, category.DisplayOrder, category.IsActive, translation?.SeoTitle, translation?.SeoDescription);

        return Result.Success(dto);
    }
}
