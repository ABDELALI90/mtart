using MTArt.SharedKernel.Domain;


namespace MTArt.Catalog.Domain.Formats;

/// <summary>A concrete size/weight specification tiles are cut/pressed to, e.g. "10x10 cm".</summary>
public sealed class Format : AuditableEntity<Guid>, IAggregateRoot
{
    public string Reference { get; private set; } = string.Empty;
    public decimal WidthCm { get; private set; }
    public decimal HeightCm { get; private set; }
    public decimal ThicknessCm { get; private set; }
    public decimal UnitsPerM2 { get; private set; }
    public decimal WeightPerUnitKg { get; private set; }
    public decimal WeightPerM2Kg { get; private set; }
    public Guid ShapeId { get; private set; }
    public Guid? DiagramImageId { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;
    public MaterialType MaterialType { get; private set; } = MaterialType.Universal;
    public bool HasVerifiedTechnicalData { get; private set; }

    private readonly List<FormatTranslation> _translations = [];
    public IReadOnlyCollection<FormatTranslation> Translations => _translations.AsReadOnly();

    private Format()
    {
    }

    private Format(
        Guid id, string reference, decimal widthCm, decimal heightCm, decimal thicknessCm,
        decimal unitsPerM2, decimal weightPerUnitKg, decimal weightPerM2Kg, Guid shapeId, int displayOrder)
        : base(id)
    {
        Reference = reference;
        WidthCm = widthCm;
        HeightCm = heightCm;
        ThicknessCm = thicknessCm;
        UnitsPerM2 = unitsPerM2;
        WeightPerUnitKg = weightPerUnitKg;
        WeightPerM2Kg = weightPerM2Kg;
        ShapeId = shapeId;
        DisplayOrder = displayOrder;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public static Format Create(
        string reference, decimal widthCm, decimal heightCm, decimal thicknessCm,
        decimal unitsPerM2, decimal weightPerUnitKg, decimal weightPerM2Kg, Guid shapeId, int displayOrder = 0) =>
        new(Guid.NewGuid(), reference, widthCm, heightCm, thicknessCm, unitsPerM2, weightPerUnitKg, weightPerM2Kg, shapeId, displayOrder);

    public string DisplayLabel() => $"{WidthCm:0.#} × {HeightCm:0.#} cm";

    public void SetMaterial(MaterialType materialType)
    {
        MaterialType = materialType;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetVerifiedTechnicalData(bool verified)
    {
        HasVerifiedTechnicalData = verified;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpsertTranslation(string languageCode, string? name, string? description)
    {
        var existing = _translations.FirstOrDefault(t =>
            string.Equals(t.LanguageCode, languageCode, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            _translations.Add(FormatTranslation.Create(Id, languageCode, name, description));
        }
        else
        {
            existing.Update(name, description);
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
