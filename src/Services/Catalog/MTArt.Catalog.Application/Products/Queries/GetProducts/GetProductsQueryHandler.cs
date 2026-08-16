using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Products.Dtos;
using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Products;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Pagination;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Queries.GetProducts;

public sealed class GetProductsQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetProductsQuery, Result<PagedResult<ProductListItemDto>>>
{
    public async Task<Result<PagedResult<ProductListItemDto>>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);

        IQueryable<Product> query = dbContext.Products.AsNoTracking()
            .Where(p => p.Status == ProductStatus.Published && !p.IsDeleted);

        if (!request.IncludeDemo)
        {
            query = query.Where(p => !p.IsDemo);
        }

        if (!string.IsNullOrWhiteSpace(request.Kind) && Enum.TryParse<CatalogPageKind>(request.Kind, true, out var kind))
        {
            query = query.Where(p => p.CatalogKind == kind);
        }

        if (!string.IsNullOrWhiteSpace(request.CategorySlug))
        {
            var categoryId = await dbContext.Categories.AsNoTracking()
                .Where(c => c.Slug.Value == request.CategorySlug)
                .Select(c => c.Id)
                .FirstOrDefaultAsync(cancellationToken);

            query = query.Where(p => p.CategoryId == categoryId);
        }

        if (!string.IsNullOrWhiteSpace(request.CollectionSlug))
        {
            var collectionId = await dbContext.Collections.AsNoTracking()
                .Where(c => c.Slug.Value == request.CollectionSlug)
                .Select(c => c.Id)
                .FirstOrDefaultAsync(cancellationToken);

            query = query.Where(p => p.CollectionId == collectionId);
        }

        if (request.ShapeId.HasValue)
        {
            query = query.Where(p => p.ShapeId == request.ShapeId);
        }

        if (request.FinishId.HasValue)
        {
            query = query.Where(p => p.FinishId == request.FinishId || p.Variants.Any(v => v.FinishId == request.FinishId));
        }

        if (request.ColorId.HasValue)
        {
            query = query.Where(p => p.Variants.Any(v => v.ColorId == request.ColorId));
        }

        if (request.FormatId.HasValue)
        {
            query = query.Where(p => p.Variants.Any(v => v.FormatId == request.FormatId));
        }

        if (request.InStockOnly == true)
        {
            query = query.Where(p => p.IsInStock);
        }

        if (request.CustomizableOnly == true)
        {
            query = query.Where(p => p.IsCustomizable);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim();
            var lowered = term.ToLowerInvariant();
            query = lowered switch
            {
                "patterned" or "motif" or "motifs" or "pattern" =>
                    query.Where(p => p.CatalogKind == CatalogPageKind.Patterned || p.CatalogKind == CatalogPageKind.Patchwork),
                "plain" or "uni" or "liso" =>
                    query.Where(p => p.CatalogKind == CatalogPageKind.Plain || p.CatalogKind == CatalogPageKind.ColorSample),
                "border" or "borders" or "bordure" or "cenefa" =>
                    query.Where(p => p.CatalogKind == CatalogPageKind.Border),
                "patchwork" =>
                    query.Where(p => p.CatalogKind == CatalogPageKind.Patchwork),
                "custom" or "personnalise" or "personalizado" =>
                    query.Where(p => p.IsCustomizable || p.IsSimulatorReady),
                _ => query.Where(p =>
                    p.Reference.Contains(term) ||
                    p.Translations.Any(t =>
                        t.Name.Contains(term) ||
                        (t.ShortDescription != null && t.ShortDescription.Contains(term)) ||
                        (t.Description != null && t.Description.Contains(term)))),
            };
        }

        query = request.Sort switch
        {
            ProductSortOrder.Newest => query.OrderByDescending(p => p.CreatedAt),
            ProductSortOrder.ReferenceAsc => query.OrderBy(p => p.Reference),
            _ => query.OrderByDescending(p => p.IsFeatured).ThenBy(p => p.DisplayOrder),
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var page = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new
            {
                p.Id,
                p.Reference,
                Slug = p.Slug.Value,
                p.CategoryId,
                p.CollectionId,
                p.IsFeatured,
                p.IsNew,
                p.IsCustomizable,
                p.IsSimulatorReady,
                p.IsInStock,
                Status = p.Status.ToString(),
                CatalogKind = p.CatalogKind.ToString(),
                p.PricePerM2,
                p.Currency,
                PriceVisibility = p.PriceVisibility.ToString(),
                p.PatternId,
                Name = p.Translations.Where(t => t.LanguageCode == language).Select(t => t.Name).FirstOrDefault()
                    ?? p.Translations.Where(t => t.LanguageCode == LanguageCode.Default).Select(t => t.Name).FirstOrDefault()
                    ?? p.Reference,
                ShortDescription = p.Translations.Where(t => t.LanguageCode == language).Select(t => t.ShortDescription).FirstOrDefault()
                    ?? p.Translations.Where(t => t.LanguageCode == LanguageCode.Default).Select(t => t.ShortDescription).FirstOrDefault(),
                PrimaryImageId = p.Images.Where(i => i.Role == ProductImageRole.Primary).Select(i => (Guid?)i.MediaId).FirstOrDefault(),
                HoverImageId = p.Images.Where(i => i.Role == ProductImageRole.Hover).Select(i => (Guid?)i.MediaId).FirstOrDefault(),
                PrimaryImageUrl = p.Images.Where(i => i.Role == ProductImageRole.Primary).Select(i => i.ImageUrl).FirstOrDefault(),
                HoverImageUrl = p.Images.Where(i => i.Role == ProductImageRole.Hover).Select(i => i.ImageUrl).FirstOrDefault(),
                ColorIds = p.Variants.Select(v => v.ColorId).Distinct().ToList(),
                FormatIds = p.Variants.Select(v => v.FormatId).Distinct().ToList(),
            })
            .ToListAsync(cancellationToken);

        var categoryLookup = await dbContext.Categories.AsNoTracking()
            .Include(c => c.Translations)
            .Where(c => page.Select(p => p.CategoryId).Distinct().Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, cancellationToken);

        var collectionIds = page.Where(p => p.CollectionId.HasValue).Select(p => p.CollectionId!.Value).Distinct().ToList();
        var collectionLookup = collectionIds.Count == 0
            ? []
            : await dbContext.Collections.AsNoTracking().Include(c => c.Translations)
                .Where(c => collectionIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, cancellationToken);

        var allColorIds = page.SelectMany(p => p.ColorIds).Distinct().ToList();
        var colorLookup = allColorIds.Count == 0
            ? []
            : await dbContext.Colors.AsNoTracking().Include(c => c.Translations)
                .Where(c => allColorIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, cancellationToken);

        var allFormatIds = page.SelectMany(p => p.FormatIds).Distinct().ToList();
        var formatLookup = allFormatIds.Count == 0
            ? []
            : await dbContext.Formats.AsNoTracking()
                .Where(f => allFormatIds.Contains(f.Id)).ToDictionaryAsync(f => f.Id, cancellationToken);

        var patternIds = page.Where(p => p.PatternId.HasValue).Select(p => p.PatternId!.Value).Distinct().ToList();
        var patternLookup = patternIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await dbContext.TilePatterns.AsNoTracking()
                .Where(p => patternIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.Slug.Value, cancellationToken);

        var items = page.Select(p =>
        {
            categoryLookup.TryGetValue(p.CategoryId, out var category);
            var categoryTranslation = category?.Translations.ForLanguage(language);

            string? collectionSlug = null;
            if (p.CollectionId.HasValue && collectionLookup.TryGetValue(p.CollectionId.Value, out var collection))
            {
                collectionSlug = collection.Slug.Value;
            }

            var colorNames = p.ColorIds
                .Select(id => colorLookup.GetValueOrDefault(id))
                .Where(c => c is not null)
                .Select(c => c!.Translations.ForLanguage(language)?.Name ?? c.Code)
                .Distinct()
                .ToList();

            var formatLabels = p.FormatIds
                .Select(id => formatLookup.GetValueOrDefault(id))
                .Where(f => f is not null)
                .Select(f => f!.DisplayLabel())
                .Distinct()
                .ToList();

            return new ProductListItemDto(
                p.Id, p.Reference, p.Slug, p.Name, p.ShortDescription,
                p.CategoryId, category?.Slug.Value ?? string.Empty, categoryTranslation?.Name ?? category?.Code ?? string.Empty,
                p.CollectionId, collectionSlug,
                p.PrimaryImageId, p.HoverImageId, p.PrimaryImageUrl, p.HoverImageUrl,
                p.IsFeatured, p.IsNew, p.IsCustomizable, p.IsSimulatorReady, p.IsInStock, p.Status,
                p.CatalogKind, p.PricePerM2, p.Currency, p.PriceVisibility,
                p.PatternId.HasValue && patternLookup.TryGetValue(p.PatternId.Value, out var patternSlug) ? patternSlug : null,
                colorNames, formatLabels);
        }).ToList();

        return Result.Success(new PagedResult<ProductListItemDto>(items, request.PageNumber, request.PageSize, totalCount));
    }
}
