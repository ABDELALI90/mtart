namespace MTArt.Catalog.Application.Collections.Dtos;

public sealed record CollectionDto(
    Guid Id, string Slug, string Name, string? Story, string? Description,
    Guid? CoverImageId, string? CoverImageUrl, int DisplayOrder, bool IsActive, string? SeoTitle, string? SeoDescription,
    int ProductCount = 0);
