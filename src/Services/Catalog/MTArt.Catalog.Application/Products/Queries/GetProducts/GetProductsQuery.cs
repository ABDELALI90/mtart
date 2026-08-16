using MTArt.Catalog.Application.Products.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Pagination;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Queries.GetProducts;

/// <summary>
/// Backs GET /api/v1/catalog/products?category=zellige&amp;color=...&amp;format=... - every
/// filter is optional and maps 1:1 to a shareable URL query parameter on the public site.
/// </summary>
public sealed record GetProductsQuery(
    string LanguageCode,
    string? CategorySlug,
    string? CollectionSlug,
    Guid? ColorId,
    Guid? ShapeId,
    Guid? FormatId,
    Guid? FinishId,
    bool? InStockOnly,
    bool? CustomizableOnly,
    string? SearchTerm,
    ProductSortOrder Sort,
    int PageNumber,
    int PageSize,
    bool IncludeDemo = false,
    string? Kind = null) : IRequest<Result<PagedResult<ProductListItemDto>>>;
