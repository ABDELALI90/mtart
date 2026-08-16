using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Products;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class ProductRelatedProductConfiguration : IEntityTypeConfiguration<ProductRelatedProduct>
{
    public void Configure(EntityTypeBuilder<ProductRelatedProduct> builder)
    {
        builder.ToTable("ProductRelatedProducts");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.RelatedProductId).IsRequired();
        builder.Property(r => r.DisplayOrder);

        builder.Ignore(r => r.DomainEvents);
    }
}
