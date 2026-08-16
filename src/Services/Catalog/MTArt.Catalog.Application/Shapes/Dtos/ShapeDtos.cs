namespace MTArt.Catalog.Application.Shapes.Dtos;

public sealed record ShapeDto(Guid Id, string Code, string Name, int DisplayOrder, bool IsActive);
