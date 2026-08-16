using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.Imports;

public sealed class CatalogImportPage : Entity<Guid>
{
    public Guid SessionId { get; private set; }
    public int PageNumber { get; private set; }
    public string ImportId { get; private set; } = string.Empty;
    public CatalogPageKind Classification { get; private set; } = CatalogPageKind.Unknown;
    public string? SuggestedName { get; private set; }
    public string? SuggestedReference { get; private set; }
    public string? SuggestedCategory { get; private set; }
    public string? DetectedShape { get; private set; }
    public decimal? ExtractedPrice { get; private set; }
    public string? PriceUnit { get; private set; }
    public string? ImageUrl { get; private set; }
    public string? DominantColors { get; private set; }
    public double ImportConfidence { get; private set; }
    public bool NeedsReview { get; private set; } = true;
    public Guid? ImportedProductId { get; private set; }

    private CatalogImportPage()
    {
    }

    private CatalogImportPage(Guid id, Guid sessionId, int pageNumber, string importId) : base(id)
    {
        SessionId = sessionId;
        PageNumber = pageNumber;
        ImportId = importId;
    }

    public static CatalogImportPage Create(Guid sessionId, int pageNumber, string importId) =>
        new(Guid.NewGuid(), sessionId, pageNumber, importId);

    public void ApplyAnalysis(
        CatalogPageKind classification,
        string? suggestedName,
        string? suggestedReference,
        string? suggestedCategory,
        string? detectedShape,
        decimal? extractedPrice,
        string? priceUnit,
        string? imageUrl,
        string? dominantColors,
        double confidence,
        bool needsReview)
    {
        Classification = classification;
        SuggestedName = suggestedName;
        SuggestedReference = suggestedReference;
        SuggestedCategory = suggestedCategory;
        DetectedShape = detectedShape;
        ExtractedPrice = extractedPrice;
        PriceUnit = priceUnit;
        ImageUrl = imageUrl;
        DominantColors = dominantColors;
        ImportConfidence = confidence;
        NeedsReview = needsReview;
    }

    public void Correct(
        CatalogPageKind classification,
        string? suggestedName,
        string? suggestedReference,
        string? suggestedCategory,
        string? detectedShape,
        decimal? extractedPrice,
        bool needsReview)
    {
        Classification = classification;
        SuggestedName = suggestedName;
        SuggestedReference = suggestedReference;
        SuggestedCategory = suggestedCategory;
        DetectedShape = detectedShape;
        ExtractedPrice = extractedPrice;
        NeedsReview = needsReview;
    }

    public void MarkImported(Guid productId)
    {
        ImportedProductId = productId;
        NeedsReview = false;
    }
}
