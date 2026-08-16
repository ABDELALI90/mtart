using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.Imports;

public sealed class CatalogImportSession : AuditableEntity<Guid>, IAggregateRoot
{
    public string SourceCatalog { get; private set; } = string.Empty;
    public CatalogImportStatus Status { get; private set; } = CatalogImportStatus.Draft;
    public int PageCount { get; private set; }
    public int ProductsDetected { get; private set; }
    public int ProjectsDetected { get; private set; }
    public int UnknownPages { get; private set; }
    public int ImportedCount { get; private set; }
    public int NeedsReviewCount { get; private set; }
    public string? ErrorSummary { get; private set; }

    private readonly List<CatalogImportPage> _pages = [];
    public IReadOnlyCollection<CatalogImportPage> Pages => _pages.AsReadOnly();

    private CatalogImportSession()
    {
    }

    private CatalogImportSession(Guid id, string sourceCatalog) : base(id)
    {
        SourceCatalog = sourceCatalog;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public static CatalogImportSession Create(string sourceCatalog) =>
        new(Guid.NewGuid(), sourceCatalog);

    public void ReplacePages(IEnumerable<CatalogImportPage> pages)
    {
        _pages.Clear();
        _pages.AddRange(pages);
        Recalculate();
        Status = CatalogImportStatus.Analyzed;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Recalculate()
    {
        PageCount = _pages.Count;
        ProductsDetected = _pages.Count(p => p.Classification is CatalogPageKind.Patterned or CatalogPageKind.Plain or CatalogPageKind.Patchwork or CatalogPageKind.Border);
        ProjectsDetected = _pages.Count(p => p.Classification == CatalogPageKind.Project);
        UnknownPages = _pages.Count(p => p.Classification == CatalogPageKind.Unknown);
        NeedsReviewCount = _pages.Count(p => p.NeedsReview);
        ImportedCount = _pages.Count(p => p.ImportedProductId.HasValue);
    }

    public void Confirm(int importedCount)
    {
        ImportedCount = importedCount;
        Status = CatalogImportStatus.Confirmed;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Cancel()
    {
        Status = CatalogImportStatus.Cancelled;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetError(string error)
    {
        ErrorSummary = error;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
