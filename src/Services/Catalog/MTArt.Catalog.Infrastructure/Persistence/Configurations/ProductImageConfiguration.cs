using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Products;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.ToTable("ProductImages");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.MediaId).IsRequired();
        builder.Property(i => i.ImageUrl).HasMaxLength(512);
        builder.Property(i => i.Role).HasConversion<string>().HasMaxLength(24);
        builder.Property(i => i.DisplayOrder);

        builder.Ignore(i => i.DomainEvents);
    }
}
