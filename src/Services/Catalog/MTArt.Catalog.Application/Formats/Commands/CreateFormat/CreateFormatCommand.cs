using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Formats.Commands.CreateFormat;

public sealed record CreateFormatCommand(
    string Reference, decimal WidthCm, decimal HeightCm, decimal ThicknessCm,
    decimal UnitsPerM2, decimal WeightPerUnitKg, decimal WeightPerM2Kg, Guid ShapeId, int DisplayOrder) : IRequest<Result<Guid>>;
