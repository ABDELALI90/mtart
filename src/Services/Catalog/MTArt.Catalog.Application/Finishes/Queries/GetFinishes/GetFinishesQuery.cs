using MTArt.Catalog.Application.Finishes.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Finishes.Queries.GetFinishes;

public sealed record GetFinishesQuery(string LanguageCode) : IRequest<Result<IReadOnlyList<FinishDto>>>;
