using MTArt.Catalog.Application.Products.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Queries.GetFeaturedProducts;

public sealed record GetFeaturedProductsQuery(string LanguageCode, int Count = 8) : IRequest<Result<IReadOnlyList<ProductListItemDto>>>;
