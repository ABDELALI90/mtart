using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Products;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Reference).HasMaxLength(64).IsRequired();
        builder.HasIndex(p => p.Reference).IsUnique();

        builder.OwnsOne(p => p.Slug, slug =>
        {
            slug.Property(s => s.Value).HasColumnName("Slug").HasMaxLength(160).IsRequired();
            slug.HasIndex(s => s.Value).IsUnique();
        });

        builder.Property(p => p.CategoryId).IsRequired();
        builder.HasIndex(p => p.CategoryId);
        builder.HasIndex(p => p.CollectionId);

        builder.Property(p => p.MinimumOrderM2).HasColumnType("decimal(8,2)");
        builder.Property(p => p.UnitsPerSquareMeter).HasColumnType("decimal(8,2)");
        builder.Property(p => p.WeightPerSquareMeterKg).HasColumnType("decimal(8,2)");
        builder.Property(p => p.ThicknessCm).HasColumnType("decimal(6,2)");
        builder.Property(p => p.CountryOfOrigin).HasMaxLength(64);
        builder.Property(p => p.Material).HasMaxLength(128);
        builder.Property(p => p.ProductionLeadTime).HasMaxLength(64);
        builder.Property(p => p.PricePerM2).HasColumnType("decimal(10,2)");
        builder.Property(p => p.Currency).HasMaxLength(8);
        builder.Property(p => p.PriceVisibility).HasConversion<string>().HasMaxLength(16);
        builder.Property(p => p.CatalogKind).HasConversion<string>().HasMaxLength(24);
        builder.Property(p => p.SourceCatalog).HasMaxLength(256);
        builder.HasIndex(p => p.IsDemo);
        builder.HasIndex(p => p.CatalogKind);
        builder.HasIndex(p => p.IsSimulatorReady);

        builder.Property(p => p.Status).HasConversion<string>().HasMaxLength(16);
        builder.HasIndex(p => p.Status);

        builder.Property(p => p.DisplayOrder);
        builder.Property(p => p.CreatedAt);
        builder.Property(p => p.UpdatedAt);

        builder.Property(p => p.IsDeleted);
        builder.HasQueryFilter(p => !p.IsDeleted);

        builder.HasMany(p => p.Translations)
            .WithOne()
            .HasForeignKey(t => t.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(p => p.Translations).HasField("_translations").UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(p => p.Variants)
            .WithOne()
            .HasForeignKey(v => v.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(p => p.Variants).HasField("_variants").UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(p => p.Images)
            .WithOne()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(p => p.Images).HasField("_images").UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(p => p.RelatedProducts)
            .WithOne()
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(p => p.RelatedProducts).HasField("_relatedProducts").UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(p => p.DomainEvents);
    }
}
