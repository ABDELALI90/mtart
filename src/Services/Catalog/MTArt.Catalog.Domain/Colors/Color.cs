using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.Colors;

/// <summary>
/// A real, photographed color sample (e.g. reference "1020" - Petrol Blue). HexApproximation
/// is only ever a rough on-screen approximation: handmade Zellige/cement tiles have natural
/// variation that no single hex value can represent, so the UI must always show ImageId and
/// must never claim screen-color accuracy (see product-detail "Natural Variation" section).
/// </summary>
public sealed class Color : AuditableEntity<Guid>, IAggregateRoot
{
    public string Code { get; private set; } = string.Empty;
    public Slug Slug { get; private set; } = null!;
    public string? HexApproximation { get; private set; }
    public Guid? ImageId { get; private set; }
    public Guid? TextureImageId { get; private set; }
    public string? ImageUrl { get; private set; }
    public string? TextureImageUrl { get; private set; }
    public int DisplayOrder { get; private set; }
    public ColorFamily Family { get; private set; }
    public MaterialType MaterialType { get; private set; } = MaterialType.Universal;
    public string? Source { get; private set; }
    public string? Rgb { get; private set; }
    public bool IsActive { get; private set; } = true;
    public bool IsFeatured { get; private set; }
    public bool IsDemo { get; private set; }

    private readonly List<ColorTranslation> _translations = [];
    public IReadOnlyCollection<ColorTranslation> Translations => _translations.AsReadOnly();

    private Color()
    {
    }

    private Color(Guid id, string code, ColorFamily family, int displayOrder) : base(id)
    {
        Code = code;
        Slug = Slug.Create(code.ToLowerInvariant());
        Family = family;
        DisplayOrder = displayOrder;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public static Color Create(string code, ColorFamily family, int displayOrder = 0) =>
        new(Guid.NewGuid(), code, family, displayOrder);

    public void UpdateCore(string code, ColorFamily family, string? hexApproximation, Guid? imageId, int displayOrder)
    {
        Code = code;
        Slug = Slug.Create(code.ToLowerInvariant());
        Family = family;
        HexApproximation = hexApproximation;
        ImageId = imageId;
        DisplayOrder = displayOrder;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetMaterial(MaterialType materialType)
    {
        MaterialType = materialType;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetFeatured(bool isFeatured)
    {
        IsFeatured = isFeatured;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MarkAsDemo(bool isDemo = true)
    {
        IsDemo = isDemo;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetPhotography(string? imageUrl, string? textureImageUrl = null, Guid? textureImageId = null)
    {
        ImageUrl = imageUrl;
        TextureImageUrl = textureImageUrl;
        TextureImageId = textureImageId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetSource(string? source, string? rgb = null)
    {
        Source = source;
        if (rgb is not null)
        {
            Rgb = rgb;
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpsertTranslation(string languageCode, string name, string? description)
    {
        var existing = _translations.FirstOrDefault(t =>
            string.Equals(t.LanguageCode, languageCode, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            _translations.Add(ColorTranslation.Create(Id, languageCode, name, description));
        }
        else
        {
            existing.Update(name, description);
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
