using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Products;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class ProductTranslationConfiguration : IEntityTypeConfiguration<ProductTranslation>
{
    public void Configure(EntityTypeBuilder<ProductTranslation> builder)
    {
        builder.ToTable("ProductTranslations");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.LanguageCode).HasMaxLength(5).IsRequired();
        builder.HasIndex(t => new { t.ProductId, t.LanguageCode }).IsUnique();

        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.ShortDescription).HasMaxLength(500);
        builder.Property(t => t.Description).HasMaxLength(4000);
        builder.Property(t => t.Craftsmanship).HasMaxLength(4000);
        builder.Property(t => t.InstallationAdvice).HasMaxLength(4000);
        builder.Property(t => t.MaintenanceAdvice).HasMaxLength(4000);
        builder.Property(t => t.SeoTitle).HasMaxLength(160);
        builder.Property(t => t.SeoDescription).HasMaxLength(320);

        builder.Ignore(t => t.DomainEvents);
    }
}
