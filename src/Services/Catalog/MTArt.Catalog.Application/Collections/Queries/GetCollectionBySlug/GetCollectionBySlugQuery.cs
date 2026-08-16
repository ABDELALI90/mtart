using MTArt.Catalog.Application.Collections.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Collections.Queries.GetCollectionBySlug;

public sealed record GetCollectionBySlugQuery(string Slug, string LanguageCode) : IRequest<Result<CollectionDto>>;
