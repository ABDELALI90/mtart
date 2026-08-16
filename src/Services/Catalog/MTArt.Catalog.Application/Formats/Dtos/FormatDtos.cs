using MTArt.Catalog.Domain;

namespace MTArt.Catalog.Application.Formats.Dtos;

public sealed record FormatDto(
    Guid Id, string Reference, string? Name, decimal WidthCm, decimal HeightCm, decimal ThicknessCm,
    decimal UnitsPerM2, decimal WeightPerUnitKg, decimal WeightPerM2Kg,
    Guid ShapeId, string ShapeName, Guid? DiagramImageId, int DisplayOrder, bool IsActive,
    MaterialType MaterialType, bool HasVerifiedTechnicalData);
