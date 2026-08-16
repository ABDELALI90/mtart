using MTArt.Catalog.Domain.Common;

namespace MTArt.Catalog.Domain.Categories;

public sealed class ProductCategoryTranslation : TranslationEntity
{
    public Guid CategoryId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? ShortDescription { get; private set; }
    public string? Description { get; private set; }
    public string? SeoTitle { get; private set; }
    public string? SeoDescription { get; private set; }

    private ProductCategoryTranslation()
    {
    }

    private ProductCategoryTranslation(
        Guid id, Guid categoryId, string languageCode, string name,
        string? shortDescription, string? description, string? seoTitle, string? seoDescription)
        : base(id, languageCode)
    {
        CategoryId = categoryId;
        Name = name;
        ShortDescription = shortDescription;
        Description = description;
        SeoTitle = seoTitle;
        SeoDescription = seoDescription;
    }

    public static ProductCategoryTranslation Create(
        Guid categoryId, string languageCode, string name,
        string? shortDescription, string? description, string? seoTitle, string? seoDescription) =>
        new(Guid.NewGuid(), categoryId, languageCode, name, shortDescription, description, seoTitle, seoDescription);

    public void Update(string name, string? shortDescription, string? description, string? seoTitle, string? seoDescription)
    {
        Name = name;
        ShortDescription = shortDescription;
        Description = description;
        SeoTitle = seoTitle;
        SeoDescription = seoDescription;
    }
}
