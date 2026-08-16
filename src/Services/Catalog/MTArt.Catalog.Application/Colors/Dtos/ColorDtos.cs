namespace MTArt.Catalog.Application.Colors.Dtos;

public sealed record ColorDto(
    Guid Id, string Code, string Slug, string Name, string? Description, string? HexApproximation,
    Guid? ImageId, string? ImageUrl, string? TextureImageUrl, string Family, string MaterialType,
    int DisplayOrder, bool IsActive, bool IsFeatured, string? Source = null, string? Rgb = null);
