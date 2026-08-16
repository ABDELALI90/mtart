using MTArt.Catalog.Application.Products.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Queries.GetProductBySlug;

public sealed record GetProductBySlugQuery(string Slug, string LanguageCode) : IRequest<Result<ProductDetailDto>>;
