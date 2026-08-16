using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.Products;

/// <summary>
/// A concrete, orderable specialization of a Product: one color + one format (+ optional
/// finish override). Example: "Zellige Bejmat, Petrol Blue, 15x5 cm, Glossy, ref. 1020".
/// </summary>
public sealed class ProductVariant : Entity<Guid>
{
    public Guid ProductId { get; private set; }
    public Guid ColorId { get; private set; }
    public Guid FormatId { get; private set; }
    public Guid? FinishId { get; private set; }
    public string Sku { get; private set; } = string.Empty;
    public string Reference { get; private set; } = string.Empty;
    public StockStatus StockStatus { get; private set; }
    public decimal UnitsPerM2 { get; private set; }
    public decimal WeightPerM2Kg { get; private set; }
    public decimal ThicknessCm { get; private set; }
    public decimal? MinimumOrder { get; private set; }

    private ProductVariant()
    {
    }

    private ProductVariant(
        Guid id, Guid productId, Guid colorId, Guid formatId, Guid? finishId, string sku, string reference,
        StockStatus stockStatus, decimal unitsPerM2, decimal weightPerM2Kg, decimal thicknessCm, decimal? minimumOrder)
        : base(id)
    {
        ProductId = productId;
        ColorId = colorId;
        FormatId = formatId;
        FinishId = finishId;
        Sku = sku;
        Reference = reference;
        StockStatus = stockStatus;
        UnitsPerM2 = unitsPerM2;
        WeightPerM2Kg = weightPerM2Kg;
        ThicknessCm = thicknessCm;
        MinimumOrder = minimumOrder;
    }

    internal static ProductVariant Create(
        Guid productId, Guid colorId, Guid formatId, Guid? finishId, string sku, string reference,
        StockStatus stockStatus, decimal unitsPerM2, decimal weightPerM2Kg, decimal thicknessCm, decimal? minimumOrder) =>
        new(Guid.NewGuid(), productId, colorId, formatId, finishId, sku, reference, stockStatus, unitsPerM2, weightPerM2Kg, thicknessCm, minimumOrder);

    public void UpdateStock(StockStatus stockStatus) => StockStatus = stockStatus;

    public void UpdateCore(string sku, string reference, decimal unitsPerM2, decimal weightPerM2Kg, decimal thicknessCm, decimal? minimumOrder)
    {
        Sku = sku;
        Reference = reference;
        UnitsPerM2 = unitsPerM2;
        WeightPerM2Kg = weightPerM2Kg;
        ThicknessCm = thicknessCm;
        MinimumOrder = minimumOrder;
    }
}
