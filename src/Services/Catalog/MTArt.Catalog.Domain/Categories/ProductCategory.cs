using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Domain;
using MTArt.SharedKernel.Localization;

namespace MTArt.Catalog.Domain.Categories;

/// <summary>
/// Top-level product family: Zellige, Bejmat, Cement Tiles, Terracotta, Decorative Tiles,
/// Special Pieces. Drives the primary mega-menu navigation and /:lang/:categorySlug routes.
/// </summary>
public sealed class ProductCategory : AuditableEntity<Guid>, IAggregateRoot
{
    public Slug Slug { get; private set; } = null!;
    public string Code { get; private set; } = string.Empty;
    public Guid? ImageId { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;

    private readonly List<ProductCategoryTranslation> _translations = [];
    public IReadOnlyCollection<ProductCategoryTranslation> Translations => _translations.AsReadOnly();

    private ProductCategory()
    {
    }

    private ProductCategory(Guid id, string code, Slug slug, int displayOrder) : base(id)
    {
        Code = code;
        Slug = slug;
        DisplayOrder = displayOrder;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public static ProductCategory Create(string code, string slug, int displayOrder = 0) =>
        new(Guid.NewGuid(), code, Slug.Create(slug), displayOrder);

    public void UpdateCore(string code, string slug, int displayOrder, Guid? imageId)
    {
        Code = code;
        Slug = Slug.Create(slug);
        DisplayOrder = displayOrder;
        ImageId = imageId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Activate() => SetActive(true);
    public void Deactivate() => SetActive(false);

    private void SetActive(bool isActive)
    {
        IsActive = isActive;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpsertTranslation(
        string languageCode, string name, string? shortDescription, string? description,
        string? seoTitle, string? seoDescription)
    {
        var existing = _translations.FirstOrDefault(t =>
            string.Equals(t.LanguageCode, languageCode, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            _translations.Add(ProductCategoryTranslation.Create(
                Id, languageCode, name, shortDescription, description, seoTitle, seoDescription));
        }
        else
        {
            existing.Update(name, shortDescription, description, seoTitle, seoDescription);
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }

    /// <summary>Fraction (0-1) of the 4 supported languages that have a non-empty Name.</summary>
    public double TranslationCompleteness() =>
        LanguageCode.All.Count(lang => _translations.Any(t =>
            string.Equals(t.LanguageCode, lang, StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(t.Name)))
        / (double)LanguageCode.All.Count;
}
