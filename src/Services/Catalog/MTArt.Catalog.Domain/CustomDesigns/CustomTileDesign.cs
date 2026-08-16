using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.CustomDesigns;

/// <summary>
/// Customer-authored cement-tile mould geometry. Stored as structured JSON plus SVG so it can
/// be reopened, recoloured, and later used to manufacture a physical divider — never as a screenshot.
/// </summary>
public sealed class CustomTileDesign : AuditableEntity<Guid>, IAggregateRoot
{
    public const string ReferencePrefix = "CUSTOM-";

    public string Reference { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public decimal WidthCm { get; private set; }
    public decimal HeightCm { get; private set; }
    public string Unit { get; private set; } = "cm";
    public string GeometryJson { get; private set; } = "{}";
    public string SvgMarkup { get; private set; } = string.Empty;
    public string? ThumbnailSvg { get; private set; }
    public string RepeatMode { get; private set; } = "straight";
    public string? ColorSummaryJson { get; private set; }
    public Guid? SourceMouldId { get; private set; }
    public bool IsEditable { get; private set; } = true;

    private CustomTileDesign()
    {
    }

    private CustomTileDesign(Guid id, string reference, string name) : base(id)
    {
        Reference = reference;
        Name = name;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public static string FormatReference(int sequence) => $"{ReferencePrefix}{sequence:D4}";

    public static int ParseSequence(string reference)
    {
        if (string.IsNullOrWhiteSpace(reference)
            || !reference.StartsWith(ReferencePrefix, StringComparison.OrdinalIgnoreCase))
        {
            return 0;
        }

        return int.TryParse(reference[ReferencePrefix.Length..], out var sequence) ? sequence : 0;
    }

    public static CustomTileDesign Create(
        string reference,
        string name,
        decimal widthCm,
        decimal heightCm,
        string geometryJson,
        string svgMarkup,
        string? thumbnailSvg,
        string repeatMode,
        string? colorSummaryJson,
        Guid? sourceMouldId)
    {
        var design = new CustomTileDesign(Guid.NewGuid(), reference.Trim().ToUpperInvariant(), name.Trim())
        {
            WidthCm = widthCm,
            HeightCm = heightCm,
            Unit = "cm",
            GeometryJson = geometryJson,
            SvgMarkup = svgMarkup,
            ThumbnailSvg = thumbnailSvg,
            RepeatMode = string.IsNullOrWhiteSpace(repeatMode) ? "straight" : repeatMode.Trim(),
            ColorSummaryJson = colorSummaryJson,
            SourceMouldId = sourceMouldId,
            IsEditable = true,
        };
        return design;
    }

    public void UpdateContent(
        string name,
        decimal widthCm,
        decimal heightCm,
        string geometryJson,
        string svgMarkup,
        string? thumbnailSvg,
        string repeatMode,
        string? colorSummaryJson)
    {
        Name = name.Trim();
        WidthCm = widthCm;
        HeightCm = heightCm;
        GeometryJson = geometryJson;
        SvgMarkup = svgMarkup;
        ThumbnailSvg = thumbnailSvg;
        RepeatMode = string.IsNullOrWhiteSpace(repeatMode) ? RepeatMode : repeatMode.Trim();
        ColorSummaryJson = colorSummaryJson;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Rename(string name)
    {
        Name = name.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
