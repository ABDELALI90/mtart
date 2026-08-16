using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Products.Dtos;
using MTArt.Catalog.Application.Products.Mapping;
using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Colors;
using MTArt.Catalog.Domain.Finishes;
using MTArt.Catalog.Domain.Formats;
using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Queries.GetProductBySlug;

public sealed class GetProductBySlugQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetProductBySlugQuery, Result<ProductDetailDto>>
{
    public async Task<Result<ProductDetailDto>> Handle(GetProductBySlugQuery request, CancellationToken cancellationToken)
    {
        var slug = Slug.Create(request.Slug);
        var language = LanguageCode.Normalize(request.LanguageCode);

        var product = await dbContext.Products
            .AsNoTracking()
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.RelatedProducts)
            .FirstOrDefaultAsync(p => p.Slug.Value == slug.Value && !p.IsDeleted && !p.IsDemo, cancellationToken);

        if (product is null)
        {
            return Result.Failure<ProductDetailDto>(Error.NotFound("products.not_found", $"Product '{request.Slug}' was not found."));
        }

        var category = await dbContext.Categories.AsNoTracking()
            .Include(c => c.Translations)
            .FirstOrDefaultAsync(c => c.Id == product.CategoryId, cancellationToken);

        var collection = product.CollectionId.HasValue
            ? await dbContext.Collections.AsNoTracking().Include(c => c.Translations)
                .FirstOrDefaultAsync(c => c.Id == product.CollectionId, cancellationToken)
            : null;

        var shape = product.ShapeId.HasValue
            ? await dbContext.Shapes.AsNoTracking().Include(s => s.Translations)
                .FirstOrDefaultAsync(s => s.Id == product.ShapeId, cancellationToken)
            : null;

        var productFinish = product.FinishId.HasValue
            ? await dbContext.Finishes.AsNoTracking().Include(f => f.Translations)
                .FirstOrDefaultAsync(f => f.Id == product.FinishId, cancellationToken)
            : null;

        var colorIds = product.Variants.Select(v => v.ColorId).Distinct().ToList();
        var formatIds = product.Variants.Select(v => v.FormatId).Distinct().ToList();
        var finishIds = product.Variants.Where(v => v.FinishId.HasValue).Select(v => v.FinishId!.Value).Distinct().ToList();

        var colors = await dbContext.Colors.AsNoTracking().Include(c => c.Translations)
            .Where(c => colorIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, cancellationToken);

        var formats = await dbContext.Formats.AsNoTracking()
            .Where(f => formatIds.Contains(f.Id)).ToDictionaryAsync(f => f.Id, cancellationToken);

        var variantFinishes = finishIds.Count == 0
            ? new Dictionary<Guid, Finish>()
            : await dbContext.Finishes.AsNoTracking().Include(f => f.Translations)
                .Where(f => finishIds.Contains(f.Id)).ToDictionaryAsync(f => f.Id, cancellationToken);

        var relatedIds = product.RelatedProducts.OrderBy(r => r.DisplayOrder).Select(r => r.RelatedProductId).ToList();
        var relatedProducts = relatedIds.Count == 0
            ? []
            : await dbContext.Products.AsNoTracking().Include(p => p.Translations).Include(p => p.Images)
                .Where(p => relatedIds.Contains(p.Id) && !p.IsDeleted)
                .Select(p => new RelatedProductDto(
                    p.Id, p.Slug.Value,
                    p.Translations.Where(t => t.LanguageCode == language).Select(t => t.Name).FirstOrDefault()
                        ?? p.Translations.Where(t => t.LanguageCode == LanguageCode.Default).Select(t => t.Name).FirstOrDefault()
                        ?? p.Reference,
                    p.Images.Where(i => i.Role == ProductImageRole.Primary).Select(i => (Guid?)i.MediaId).FirstOrDefault()))
                .ToListAsync(cancellationToken);

        string? patternSlug = null;
        if (product.PatternId.HasValue)
        {
            patternSlug = await dbContext.TilePatterns.AsNoTracking()
                .Where(p => p.Id == product.PatternId)
                .Select(p => p.Slug.Value)
                .FirstOrDefaultAsync(cancellationToken);
        }

        var categoryTranslation = category?.Translations.ForLanguage(language);
        var collectionTranslation = collection?.Translations.ForLanguage(language);
        var shapeTranslation = shape?.Translations.ForLanguage(language);
        var finishTranslation = productFinish?.Translations.ForLanguage(language);

        var dto = product.ToDetailDto(
            language,
            category?.Slug.Value ?? string.Empty,
            categoryTranslation?.Name ?? category?.Code ?? string.Empty,
            collection?.Slug.Value,
            collectionTranslation?.Name,
            shapeTranslation?.Name,
            finishTranslation?.Name,
            colors,
            formats,
            variantFinishes,
            relatedProducts,
            patternSlug);

        return Result.Success(dto);
    }
}
