using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Products;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.ToTable("ProductVariants");
        builder.HasKey(v => v.Id);

        builder.Property(v => v.Sku).HasMaxLength(64).IsRequired();
        builder.HasIndex(v => v.Sku).IsUnique();

        builder.Property(v => v.Reference).HasMaxLength(64).IsRequired();

        builder.Property(v => v.ColorId).IsRequired();
        builder.HasIndex(v => v.ColorId);
        builder.Property(v => v.FormatId).IsRequired();
        builder.HasIndex(v => v.FormatId);
        builder.Property(v => v.FinishId);

        builder.Property(v => v.StockStatus).HasConversion<string>().HasMaxLength(16);

        builder.Property(v => v.UnitsPerM2).HasColumnType("decimal(8,2)");
        builder.Property(v => v.WeightPerM2Kg).HasColumnType("decimal(8,2)");
        builder.Property(v => v.ThicknessCm).HasColumnType("decimal(6,2)");
        builder.Property(v => v.MinimumOrder).HasColumnType("decimal(8,2)");

        builder.Ignore(v => v.DomainEvents);
    }
}
