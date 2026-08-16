using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.Patterns;

public sealed class PatternCategory : AuditableEntity<Guid>, IAggregateRoot
{
    public string Code { get; private set; } = string.Empty;
    public Slug Slug { get; private set; } = null!;
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;

    private readonly List<PatternCategoryTranslation> _translations = [];
    public IReadOnlyCollection<PatternCategoryTranslation> Translations => _translations.AsReadOnly();

    private PatternCategory()
    {
    }

    private PatternCategory(Guid id, string code, Slug slug, int displayOrder) : base(id)
    {
        Code = code;
        Slug = slug;
        DisplayOrder = displayOrder;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public static PatternCategory Create(string code, string slug, int displayOrder = 0) =>
        new(Guid.NewGuid(), code, Slug.Create(slug), displayOrder);

    public void UpsertTranslation(string languageCode, string name)
    {
        var existing = _translations.FirstOrDefault(t =>
            string.Equals(t.LanguageCode, languageCode, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            _translations.Add(PatternCategoryTranslation.Create(Id, languageCode, name));
        }
        else
        {
            existing.Update(name);
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
