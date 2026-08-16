using MTArt.Catalog.Application.Formats.Dtos;
using MTArt.Catalog.Domain;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Formats.Queries.GetFormats;

public sealed record GetFormatsQuery(
    string LanguageCode,
    Guid? ShapeId = null,
    bool ActiveOnly = true,
    MaterialType? MaterialType = null) : IRequest<Result<IReadOnlyList<FormatDto>>>;
