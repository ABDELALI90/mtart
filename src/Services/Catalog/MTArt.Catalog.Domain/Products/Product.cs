using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Domain;
using MTArt.SharedKernel.Localization;

namespace MTArt.Catalog.Domain.Products;

/// <summary>
/// The catalog's central aggregate. A Product represents one model (e.g. "Zellige Bejmat"),
/// which is then specialized into concrete, orderable <see cref="ProductVariant"/>s by
/// color/format/finish combination.
/// </summary>
public sealed class Product : AuditableEntity<Guid>, IAggregateRoot, ISoftDeletable
{
    public string Reference { get; private set; } = string.Empty;
    public Slug Slug { get; private set; } = null!;
    public Guid CategoryId { get; private set; }
    public Guid? CollectionId { get; private set; }
    public Guid? ShapeId { get; private set; }
    public Guid? FinishId { get; private set; }

    public bool IsFeatured { get; private set; }
    public bool IsNew { get; private set; }
    public bool IsCustomizable { get; private set; }
    public bool IsInStock { get; private set; }

    public decimal? MinimumOrderM2 { get; private set; }
    public decimal? UnitsPerSquareMeter { get; private set; }
    public decimal? WeightPerSquareMeterKg { get; private set; }
    public decimal? ThicknessCm { get; private set; }
    public string? CountryOfOrigin { get; private set; } = "Morocco";
    public string? Material { get; private set; }
    public string? ProductionLeadTime { get; private set; }

    public decimal? PricePerM2 { get; private set; }
    public string Currency { get; private set; } = "MAD";
    public PriceVisibility PriceVisibility { get; private set; } = PriceVisibility.Public;
    public bool IsDemo { get; private set; }
    public bool IsSimulatorReady { get; private set; }
    public CatalogPageKind CatalogKind { get; private set; } = CatalogPageKind.Unknown;
    public string? SourceCatalog { get; private set; }
    public int? SourcePage { get; private set; }
    public Guid? PatternId { get; private set; }

    public ProductStatus Status { get; private set; } = ProductStatus.Draft;
    public int DisplayOrder { get; private set; }

    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    private readonly List<ProductTranslation> _translations = [];
    public IReadOnlyCollection<ProductTranslation> Translations => _translations.AsReadOnly();

    private readonly List<ProductVariant> _variants = [];
    public IReadOnlyCollection<ProductVariant> Variants => _variants.AsReadOnly();

    private readonly List<ProductImage> _images = [];
    public IReadOnlyCollection<ProductImage> Images => _images.AsReadOnly();

    private readonly List<ProductRelatedProduct> _relatedProducts = [];
    public IReadOnlyCollection<ProductRelatedProduct> RelatedProducts => _relatedProducts.AsReadOnly();

    private Product()
    {
    }

    private Product(Guid id, string reference, Slug slug, Guid categoryId, int displayOrder) : base(id)
    {
        Reference = reference;
        Slug = slug;
        CategoryId = categoryId;
        DisplayOrder = displayOrder;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public static Product Create(string reference, string slug, Guid categoryId, int displayOrder = 0) =>
        new(Guid.NewGuid(), reference, Slug.Create(slug), categoryId, displayOrder);

    public void UpdateCore(
        string reference, string slug, Guid categoryId, Guid? collectionId, Guid? shapeId, Guid? finishId,
        bool isCustomizable, decimal? minimumOrderM2, decimal? unitsPerSquareMeter, decimal? weightPerSquareMeterKg,
        decimal? thicknessCm, string? countryOfOrigin, string? material, string? productionLeadTime, int displayOrder)
    {
        Reference = reference;
        Slug = Slug.Create(slug);
        CategoryId = categoryId;
        CollectionId = collectionId;
        ShapeId = shapeId;
        FinishId = finishId;
        IsCustomizable = isCustomizable;
        MinimumOrderM2 = minimumOrderM2;
        UnitsPerSquareMeter = unitsPerSquareMeter;
        WeightPerSquareMeterKg = weightPerSquareMeterKg;
        ThicknessCm = thicknessCm;
        CountryOfOrigin = countryOfOrigin;
        Material = material;
        ProductionLeadTime = productionLeadTime;
        DisplayOrder = displayOrder;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetFeatured(bool isFeatured)
    {
        IsFeatured = isFeatured;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetNew(bool isNew)
    {
        IsNew = isNew;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RecomputeStockFromVariants()
    {
        IsInStock = _variants.Any(v => v.StockStatus is StockStatus.InStock or StockStatus.LowStock);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// A product can only go live once it has at least an English translation (the default
    /// fallback language) and at least one image - otherwise the public site would render a
    /// broken-looking card/detail page.
    /// </summary>
    public void Publish()
    {
        var hasDefaultTranslation = _translations.Any(t =>
            string.Equals(t.LanguageCode, SharedKernel.Localization.LanguageCode.Default, StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(t.Name));

        if (!hasDefaultTranslation)
        {
            throw new InvalidOperationException(
                $"Product '{Reference}' cannot be published without at least an English (default) translation.");
        }

        if (_images.Count == 0)
        {
            throw new InvalidOperationException($"Product '{Reference}' cannot be published without at least one image.");
        }

        Status = ProductStatus.Published;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Unpublish()
    {
        Status = ProductStatus.Draft;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Archive()
    {
        Status = ProductStatus.Archived;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTimeOffset.UtcNow;
    }

    public void UpsertTranslation(
        string languageCode, string name, string? shortDescription, string? description,
        string? craftsmanship, string? installationAdvice, string? maintenanceAdvice,
        string? seoTitle, string? seoDescription)
    {
        var existing = _translations.FirstOrDefault(t =>
            string.Equals(t.LanguageCode, languageCode, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            _translations.Add(ProductTranslation.Create(
                Id, languageCode, name, shortDescription, description, craftsmanship,
                installationAdvice, maintenanceAdvice, seoTitle, seoDescription));
        }
        else
        {
            existing.Update(name, shortDescription, description, craftsmanship, installationAdvice, maintenanceAdvice, seoTitle, seoDescription);
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public ProductVariant AddVariant(
        Guid colorId, Guid formatId, Guid? finishId, string sku, string reference,
        StockStatus stockStatus, decimal unitsPerM2, decimal weightPerM2Kg, decimal thicknessCm, decimal? minimumOrder)
    {
        var variant = ProductVariant.Create(Id, colorId, formatId, finishId, sku, reference, stockStatus, unitsPerM2, weightPerM2Kg, thicknessCm, minimumOrder);
        _variants.Add(variant);
        RecomputeStockFromVariants();
        return variant;
    }

    public void RemoveVariant(Guid variantId)
    {
        var variant = _variants.FirstOrDefault(v => v.Id == variantId)
            ?? throw new SharedKernel.Exceptions.NotFoundException(nameof(ProductVariant), variantId);

        _variants.Remove(variant);
        RecomputeStockFromVariants();
    }

    public void SetPricing(decimal? pricePerM2, string currency = "MAD", PriceVisibility visibility = PriceVisibility.Public)
    {
        PricePerM2 = pricePerM2;
        Currency = currency;
        PriceVisibility = visibility;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MarkAsDemo(bool isDemo = true)
    {
        IsDemo = isDemo;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetSimulatorReady(bool isReady, Guid? patternId = null)
    {
        IsSimulatorReady = isReady;
        IsCustomizable = isReady || IsCustomizable;
        PatternId = patternId ?? PatternId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetCatalogOrigin(CatalogPageKind kind, string? sourceCatalog, int? sourcePage)
    {
        CatalogKind = kind;
        SourceCatalog = sourceCatalog;
        SourcePage = sourcePage;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public ProductImage AddImage(Guid mediaId, ProductImageRole role, int displayOrder, string? imageUrl = null)
    {
        var image = ProductImage.Create(Id, mediaId, role, displayOrder, imageUrl);
        _images.Add(image);
        UpdatedAt = DateTimeOffset.UtcNow;
        return image;
    }

    public void RemoveImage(Guid imageId)
    {
        var image = _images.FirstOrDefault(i => i.Id == imageId)
            ?? throw new SharedKernel.Exceptions.NotFoundException(nameof(ProductImage), imageId);

        _images.Remove(image);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ReorderImages(IReadOnlyList<Guid> orderedImageIds)
    {
        for (var index = 0; index < orderedImageIds.Count; index++)
        {
            var image = _images.FirstOrDefault(i => i.Id == orderedImageIds[index]);
            image?.SetDisplayOrder(index);
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetRelatedProducts(IReadOnlyList<Guid> relatedProductIds)
    {
        _relatedProducts.Clear();
        for (var index = 0; index < relatedProductIds.Count; index++)
        {
            _relatedProducts.Add(ProductRelatedProduct.Create(Id, relatedProductIds[index], index));
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public double TranslationCompleteness() =>
        SharedKernel.Localization.LanguageCode.All.Count(lang => _translations.Any(t =>
            string.Equals(t.LanguageCode, lang, StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(t.Name)))
        / (double)SharedKernel.Localization.LanguageCode.All.Count;
}
