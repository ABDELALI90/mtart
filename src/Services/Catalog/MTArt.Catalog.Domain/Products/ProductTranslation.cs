using MTArt.Catalog.Domain.Common;

namespace MTArt.Catalog.Domain.Products;

public sealed class ProductTranslation : TranslationEntity
{
    public Guid ProductId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? ShortDescription { get; private set; }
    public string? Description { get; private set; }
    public string? Craftsmanship { get; private set; }
    public string? InstallationAdvice { get; private set; }
    public string? MaintenanceAdvice { get; private set; }
    public string? SeoTitle { get; private set; }
    public string? SeoDescription { get; private set; }

    private ProductTranslation()
    {
    }

    private ProductTranslation(
        Guid id, Guid productId, string languageCode, string name, string? shortDescription, string? description,
        string? craftsmanship, string? installationAdvice, string? maintenanceAdvice, string? seoTitle, string? seoDescription)
        : base(id, languageCode)
    {
        ProductId = productId;
        Name = name;
        ShortDescription = shortDescription;
        Description = description;
        Craftsmanship = craftsmanship;
        InstallationAdvice = installationAdvice;
        MaintenanceAdvice = maintenanceAdvice;
        SeoTitle = seoTitle;
        SeoDescription = seoDescription;
    }

    public static ProductTranslation Create(
        Guid productId, string languageCode, string name, string? shortDescription, string? description,
        string? craftsmanship, string? installationAdvice, string? maintenanceAdvice, string? seoTitle, string? seoDescription) =>
        new(Guid.NewGuid(), productId, languageCode, name, shortDescription, description, craftsmanship, installationAdvice, maintenanceAdvice, seoTitle, seoDescription);

    public void Update(
        string name, string? shortDescription, string? description, string? craftsmanship,
        string? installationAdvice, string? maintenanceAdvice, string? seoTitle, string? seoDescription)
    {
        Name = name;
        ShortDescription = shortDescription;
        Description = description;
        Craftsmanship = craftsmanship;
        InstallationAdvice = installationAdvice;
        MaintenanceAdvice = maintenanceAdvice;
        SeoTitle = seoTitle;
        SeoDescription = seoDescription;
    }
}
