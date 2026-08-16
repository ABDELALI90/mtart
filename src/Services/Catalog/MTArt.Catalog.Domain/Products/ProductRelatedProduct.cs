using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.Products;

public sealed class ProductRelatedProduct : Entity<Guid>
{
    public Guid ProductId { get; private set; }
    public Guid RelatedProductId { get; private set; }
    public int DisplayOrder { get; private set; }

    private ProductRelatedProduct()
    {
    }

    private ProductRelatedProduct(Guid id, Guid productId, Guid relatedProductId, int displayOrder) : base(id)
    {
        ProductId = productId;
        RelatedProductId = relatedProductId;
        DisplayOrder = displayOrder;
    }

    internal static ProductRelatedProduct Create(Guid productId, Guid relatedProductId, int displayOrder) =>
        new(Guid.NewGuid(), productId, relatedProductId, displayOrder);
}
