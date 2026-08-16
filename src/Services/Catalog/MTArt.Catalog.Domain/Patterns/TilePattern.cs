using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.Patterns;

/// <summary>
/// Cement tile mould (قالب). Persistence type remains TilePattern; the public API exposes
/// this aggregate as CementTileMould. Each region is independently recolored — never a global tint.
/// </summary>
public sealed class TilePattern : AuditableEntity<Guid>, IAggregateRoot
{
    public string Reference { get; private set; } = string.Empty;
    public Slug Slug { get; private set; } = null!;
    public Guid CategoryId { get; private set; }
    public Guid? FormatId { get; private set; }
    public Guid? BasePreviewImageId { get; private set; }
    public string? BasePreviewImageUrl { get; private set; }
    public Guid? VectorAssetId { get; private set; }
    public string? VectorAssetUrl { get; private set; }
    public int RegionCount { get; private set; }
    public bool IsCustomizable { get; private set; }
    public bool IsSimulatorReady { get; private set; }
    public bool IsActive { get; private set; } = true;
    public int DisplayOrder { get; private set; }

    private readonly List<TilePatternTranslation> _translations = [];
    public IReadOnlyCollection<TilePatternTranslation> Translations => _translations.AsReadOnly();

    private readonly List<TilePatternRegion> _regions = [];
    public IReadOnlyCollection<TilePatternRegion> Regions => _regions.AsReadOnly();

    private TilePattern()
    {
    }

    private TilePattern(Guid id, string reference, Slug slug, Guid categoryId, int displayOrder) : base(id)
    {
        Reference = reference;
        Slug = slug;
        CategoryId = categoryId;
        DisplayOrder = displayOrder;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public static TilePattern Create(string reference, string slug, Guid categoryId, int displayOrder = 0) =>
        new(Guid.NewGuid(), reference, Slug.Create(slug), categoryId, displayOrder);

    public void UpdateAssets(string? previewUrl, string? vectorUrl, Guid? formatId, bool isSimulatorReady)
    {
        BasePreviewImageUrl = previewUrl;
        VectorAssetUrl = vectorUrl;
        FormatId = formatId;
        IsSimulatorReady = isSimulatorReady;
        IsCustomizable = isSimulatorReady;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetSimulatorReady(bool ready)
    {
        IsSimulatorReady = ready;
        IsCustomizable = ready;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetCustomizable(bool customizable)
    {
        IsCustomizable = customizable;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateCore(
        string reference,
        string slug,
        Guid categoryId,
        Guid? formatId,
        int displayOrder,
        string? previewUrl,
        string? vectorUrl)
    {
        Reference = reference.Trim();
        Slug = Slug.Create(slug);
        CategoryId = categoryId;
        FormatId = formatId;
        DisplayOrder = displayOrder;
        BasePreviewImageUrl = previewUrl;
        VectorAssetUrl = vectorUrl;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ClearRegions()
    {
        _regions.Clear();
        RegionCount = 0;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpsertTranslation(string languageCode, string name, string? description = null)
    {
        var existing = _translations.FirstOrDefault(t =>
            string.Equals(t.LanguageCode, languageCode, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            _translations.Add(TilePatternTranslation.Create(Id, languageCode, name, description));
        }
        else
        {
            existing.Update(name, description);
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public TilePatternRegion AddRegion(string regionKey, string displayName, Guid? defaultColorId, int displayOrder)
    {
        var region = TilePatternRegion.Create(Id, regionKey, displayName, defaultColorId, displayOrder);
        _regions.Add(region);
        RegionCount = _regions.Count;
        UpdatedAt = DateTimeOffset.UtcNow;
        return region;
    }
}
