using MTArt.Catalog.Application.Products.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Queries.SearchProducts;

/// <summary>
/// SQL-based product search (Reference/Name Contains). This is the concrete implementation
/// behind the search abstraction described in /docs/architecture.md - swapping to
/// Elasticsearch/Meilisearch later only means adding a new handler, the query/DTO contract
/// (and the frontend calling it) stays identical.
/// </summary>
public sealed record SearchProductsQuery(string Term, string LanguageCode, int Limit = 10) : IRequest<Result<IReadOnlyList<ProductListItemDto>>>;
