using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.Products;

/// <summary>
/// A reference to a file owned by the Media service (MediaId). Catalog never stores binaries
/// or even URLs directly - the Media service is the single source of truth for the actual
/// asset, responsive variants and alt text.
/// </summary>
public sealed class ProductImage : Entity<Guid>
{
    public Guid ProductId { get; private set; }
    public Guid MediaId { get; private set; }
    public string? ImageUrl { get; private set; }
    public ProductImageRole Role { get; private set; }
    public int DisplayOrder { get; private set; }

    private ProductImage()
    {
    }

    private ProductImage(Guid id, Guid productId, Guid mediaId, ProductImageRole role, int displayOrder, string? imageUrl) : base(id)
    {
        ProductId = productId;
        MediaId = mediaId;
        Role = role;
        DisplayOrder = displayOrder;
        ImageUrl = imageUrl;
    }

    internal static ProductImage Create(Guid productId, Guid mediaId, ProductImageRole role, int displayOrder, string? imageUrl = null) =>
        new(Guid.NewGuid(), productId, mediaId, role, displayOrder, imageUrl);

    public void SetImageUrl(string? imageUrl) => ImageUrl = imageUrl;

    public void SetDisplayOrder(int displayOrder) => DisplayOrder = displayOrder;

    public void SetRole(ProductImageRole role) => Role = role;
}
