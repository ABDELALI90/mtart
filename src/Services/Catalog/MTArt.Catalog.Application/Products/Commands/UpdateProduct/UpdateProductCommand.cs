using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.UpdateProduct;

public sealed record UpdateProductCommand(
    Guid ProductId,
    string Reference,
    string Slug,
    Guid CategoryId,
    Guid? CollectionId,
    Guid? ShapeId,
    Guid? FinishId,
    bool IsCustomizable,
    bool IsFeatured,
    bool IsNew,
    decimal? MinimumOrderM2,
    decimal? UnitsPerSquareMeter,
    decimal? WeightPerSquareMeterKg,
    decimal? ThicknessCm,
    string? CountryOfOrigin,
    string? Material,
    string? ProductionLeadTime,
    int DisplayOrder) : IRequest<Result>;
