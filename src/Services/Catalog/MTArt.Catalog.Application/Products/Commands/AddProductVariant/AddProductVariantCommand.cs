using MTArt.Catalog.Domain;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Commands.AddProductVariant;

public sealed record AddProductVariantCommand(
    Guid ProductId,
    Guid ColorId,
    Guid FormatId,
    Guid? FinishId,
    string Sku,
    string Reference,
    StockStatus StockStatus,
    decimal UnitsPerM2,
    decimal WeightPerM2Kg,
    decimal ThicknessCm,
    decimal? MinimumOrder) : IRequest<Result<Guid>>;
