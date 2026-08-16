namespace MTArt.Catalog.Application.Categories.Dtos;

public sealed record CategoryDto(
    Guid Id, string Code, string Slug, string Name, string? ShortDescription, string? Description,
    Guid? ImageId, int DisplayOrder, bool IsActive, string? SeoTitle, string? SeoDescription);

public sealed record CategoryTranslationDto(string LanguageCode, string Name, string? ShortDescription, string? Description, string? SeoTitle, string? SeoDescription);
