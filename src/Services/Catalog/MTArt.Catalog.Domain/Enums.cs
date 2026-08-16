namespace MTArt.Catalog.Domain;

public enum ProductStatus
{
    Draft = 0,
    Published = 1,
    Archived = 2,
}

/// <summary>
/// Deliberately coarse-grained (per spec: "Display stock without necessarily revealing exact
/// quantities"). Precise on-hand quantities can be tracked privately by admin later without
/// changing this public-facing contract.
/// </summary>
public enum StockStatus
{
    InStock = 0,
    LowStock = 1,
    MadeToOrder = 2,
    ContactUs = 3,
}

public enum ColorFamily
{
    White = 0,
    Beige = 1,
    Yellow = 2,
    Orange = 3,
    Red = 4,
    Pink = 5,
    Green = 6,
    Blue = 7,
    Brown = 8,
    Grey = 9,
    Black = 10,
    Metallic = 11,
    Cream = 12,
    Purple = 13,
    Turquoise = 14,
    Terracotta = 15,
    Special = 16,
}

public enum MaterialType
{
    Universal = 0,
    Zellige = 1,
    CementTile = 2,
    Terracotta = 3,
    Bejmat = 4,
}

public enum PriceVisibility
{
    Public = 0,
    QuoteOnly = 1,
    Hidden = 2,
}

public enum CatalogPageKind
{
    Unknown = 0,
    Patterned = 1,
    Plain = 2,
    Border = 3,
    Patchwork = 4,
    Project = 5,
    Custom = 6,
    Marketing = 7,
    ColorSample = 8,
}

public enum CatalogImportStatus
{
    Draft = 0,
    Analyzed = 1,
    NeedsReview = 2,
    Confirmed = 3,
    Cancelled = 4,
}

public enum ProductImageRole
{
    Primary = 0,
    Hover = 1,
    Gallery = 2,
    TechnicalDiagram = 3,
    Lifestyle = 4,
}
