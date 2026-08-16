using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.Finishes;

/// <summary>Surface finish: Glossy, Matte, Antique, Natural, ...</summary>
public sealed class Finish : AuditableEntity<Guid>, IAggregateRoot
{
    public string Code { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;

    private readonly List<FinishTranslation> _translations = [];
    public IReadOnlyCollection<FinishTranslation> Translations => _translations.AsReadOnly();

    private Finish()
    {
    }

    private Finish(Guid id, string code, int displayOrder) : base(id)
    {
        Code = code;
        DisplayOrder = displayOrder;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public static Finish Create(string code, int displayOrder = 0) => new(Guid.NewGuid(), code, displayOrder);

    public void UpsertTranslation(string languageCode, string name)
    {
        var existing = _translations.FirstOrDefault(t =>
            string.Equals(t.LanguageCode, languageCode, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            _translations.Add(FinishTranslation.Create(Id, languageCode, name));
        }
        else
        {
            existing.Update(name);
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
