using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.CreateProduct;

public sealed record CreateProductCommand(
    string Reference,
    string Slug,
    Guid CategoryId,
    Guid? CollectionId,
    Guid? ShapeId,
    Guid? FinishId,
    bool IsCustomizable,
    decimal? MinimumOrderM2,
    decimal? UnitsPerSquareMeter,
    decimal? WeightPerSquareMeterKg,
    decimal? ThicknessCm,
    string? CountryOfOrigin,
    string? Material,
    string? ProductionLeadTime,
    int DisplayOrder) : IRequest<Result<Guid>>;
