using MTArt.Catalog.Application.Collections.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Collections.Queries.GetCollections;

public sealed record GetCollectionsQuery(string LanguageCode, bool ActiveOnly = true) : IRequest<Result<IReadOnlyList<CollectionDto>>>;
