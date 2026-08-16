using MTArt.Catalog.Application.Colors.Dtos;
using MTArt.Catalog.Domain;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Colors.Queries.GetColors;

public sealed record GetColorsQuery(
    string LanguageCode,
    ColorFamily? Family = null,
    bool ActiveOnly = true,
    MaterialType? MaterialType = null,
    bool IncludeDemo = false,
    string? Source = null) : IRequest<Result<IReadOnlyList<ColorDto>>>;
