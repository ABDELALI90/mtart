namespace MTArt.Catalog.Application.Common.Options;

/// <summary>
/// Soft manufacturability thresholds for custom cement-tile moulds. The workshop can change these
/// without a code release. Warnings never block the customer from designing or saving.
/// </summary>
public sealed class ManufacturingOptions
{
    public const string SectionName = "Manufacturing";

    /// <summary>Minimum closed-region area in square millimetres.</summary>
    public double MinRegionAreaMm2 { get; set; } = 80;

    /// <summary>Minimum bounding width/height of a colour zone in millimetres.</summary>
    public double MinRegionWidthMm { get; set; } = 4;

    /// <summary>Maximum allowed overlap of two filled shapes as a fraction of the smaller area.</summary>
    public double MaxOverlapRatio { get; set; } = 0.25;

    /// <summary>Minimum intended gap between neighbouring dividers in millimetres.</summary>
    public double MinGapMm { get; set; } = 1.5;
}
