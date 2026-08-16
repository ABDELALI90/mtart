using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Collections.Dtos;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Collections.Queries.GetCollectionBySlug;

public sealed class GetCollectionBySlugQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetCollectionBySlugQuery, Result<CollectionDto>>
{
    public async Task<Result<CollectionDto>> Handle(GetCollectionBySlugQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);
        var slug = Slug.Create(request.Slug);

        var collection = await dbContext.Collections.AsNoTracking()
            .Include(c => c.Translations)
            .FirstOrDefaultAsync(c => c.Slug.Value == slug.Value, cancellationToken);

        if (collection is null)
        {
            return Result.Failure<CollectionDto>(Error.NotFound("collections.not_found", $"Collection '{request.Slug}' was not found."));
        }

        var translation = collection.Translations.ForLanguage(language);
        var productCount = await dbContext.Products.AsNoTracking()
            .CountAsync(p => !p.IsDemo && p.CollectionId == collection.Id, cancellationToken);
        var dto = new CollectionDto(
            collection.Id, collection.Slug.Value, translation?.Name ?? collection.Slug.Value, translation?.Story, translation?.Description,
            collection.CoverImageId, collection.CoverImageUrl, collection.DisplayOrder, collection.IsActive, translation?.SeoTitle, translation?.SeoDescription,
            productCount);

        return Result.Success(dto);
    }
}
