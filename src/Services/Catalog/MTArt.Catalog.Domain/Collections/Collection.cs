using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Domain;
using MTArt.SharedKernel.Localization;

namespace MTArt.Catalog.Domain.Collections;

/// <summary>
/// A curated grouping that crosses categories (e.g. "Atlas", "Mediterranean"): has its own
/// editorial hero/story, and a set of products that belong to it.
/// </summary>
public sealed class Collection : AuditableEntity<Guid>, IAggregateRoot
{
    public Slug Slug { get; private set; } = null!;
    public Guid? CoverImageId { get; private set; }
    public string? CoverImageUrl { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;
    public bool IsDemo { get; private set; }

    private readonly List<CollectionTranslation> _translations = [];
    public IReadOnlyCollection<CollectionTranslation> Translations => _translations.AsReadOnly();

    private Collection()
    {
    }

    private Collection(Guid id, Slug slug, int displayOrder) : base(id)
    {
        Slug = slug;
        DisplayOrder = displayOrder;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public static Collection Create(string slug, int displayOrder = 0) =>
        new(Guid.NewGuid(), Slug.Create(slug), displayOrder);

    public void UpdateCore(string slug, int displayOrder, Guid? coverImageId, string? coverImageUrl = null)
    {
        Slug = Slug.Create(slug);
        DisplayOrder = displayOrder;
        CoverImageId = coverImageId;
        CoverImageUrl = coverImageUrl;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetCoverImageUrl(string? coverImageUrl)
    {
        CoverImageUrl = coverImageUrl;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MarkAsDemo(bool isDemo = true)
    {
        IsDemo = isDemo;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpsertTranslation(string languageCode, string name, string? story, string? description, string? seoTitle, string? seoDescription)
    {
        var existing = _translations.FirstOrDefault(t =>
            string.Equals(t.LanguageCode, languageCode, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            _translations.Add(CollectionTranslation.Create(Id, languageCode, name, story, description, seoTitle, seoDescription));
        }
        else
        {
            existing.Update(name, story, description, seoTitle, seoDescription);
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public double TranslationCompleteness() =>
        SharedKernel.Localization.LanguageCode.All.Count(lang => _translations.Any(t =>
            string.Equals(t.LanguageCode, lang, StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(t.Name)))
        / (double)SharedKernel.Localization.LanguageCode.All.Count;
}
