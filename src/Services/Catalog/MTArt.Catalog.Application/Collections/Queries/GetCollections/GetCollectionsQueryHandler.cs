using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Collections.Dtos;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Collections.Queries.GetCollections;

public sealed class GetCollectionsQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetCollectionsQuery, Result<IReadOnlyList<CollectionDto>>>
{
    public async Task<Result<IReadOnlyList<CollectionDto>>> Handle(GetCollectionsQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);

        var collections = await dbContext.Collections.AsNoTracking()
            .Include(c => c.Translations)
            .Where(c => !request.ActiveOnly || c.IsActive)
            .Where(c => !c.IsDemo)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync(cancellationToken);

        var collectionIds = collections.Select(c => c.Id).ToList();
        var productCounts = await dbContext.Products.AsNoTracking()
            .Where(p => !p.IsDemo && p.CollectionId != null && collectionIds.Contains(p.CollectionId.Value))
            .GroupBy(p => p.CollectionId)
            .Select(g => new { CollectionId = g.Key!.Value, Count = g.Count() })
            .ToDictionaryAsync(x => x.CollectionId, x => x.Count, cancellationToken);

        var dtos = collections.Select(c =>
        {
            var translation = c.Translations.ForLanguage(language);
            productCounts.TryGetValue(c.Id, out var count);
            return new CollectionDto(
                c.Id, c.Slug.Value, translation?.Name ?? c.Slug.Value, translation?.Story, translation?.Description,
                c.CoverImageId, c.CoverImageUrl, c.DisplayOrder, c.IsActive, translation?.SeoTitle, translation?.SeoDescription,
                count);
        }).ToList();

        return Result.Success<IReadOnlyList<CollectionDto>>(dtos);
    }
}
