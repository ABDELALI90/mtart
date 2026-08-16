using MTArt.Catalog.Application.Shapes.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Shapes.Queries.GetShapes;

public sealed record GetShapesQuery(string LanguageCode) : IRequest<Result<IReadOnlyList<ShapeDto>>>;
