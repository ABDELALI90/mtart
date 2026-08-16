using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.Shapes;

/// <summary>The geometric outline of a tile: Square, Hexagon, Triangle, Diamond, Star, Cross, Octagon, Custom...</summary>
public sealed class Shape : AuditableEntity<Guid>, IAggregateRoot
{
    public string Code { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;

    private readonly List<ShapeTranslation> _translations = [];
    public IReadOnlyCollection<ShapeTranslation> Translations => _translations.AsReadOnly();

    private Shape()
    {
    }

    private Shape(Guid id, string code, int displayOrder) : base(id)
    {
        Code = code;
        DisplayOrder = displayOrder;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public static Shape Create(string code, int displayOrder = 0) => new(Guid.NewGuid(), code, displayOrder);

    public void UpsertTranslation(string languageCode, string name)
    {
        var existing = _translations.FirstOrDefault(t =>
            string.Equals(t.LanguageCode, languageCode, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            _translations.Add(ShapeTranslation.Create(Id, languageCode, name));
        }
        else
        {
            existing.Update(name);
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
