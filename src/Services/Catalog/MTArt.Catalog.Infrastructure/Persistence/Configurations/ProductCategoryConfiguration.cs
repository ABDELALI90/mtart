using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Categories;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class ProductCategoryConfiguration : IEntityTypeConfiguration<ProductCategory>
{
    public void Configure(EntityTypeBuilder<ProductCategory> builder)
    {
        builder.ToTable("Categories");
        builder.HasKey(c => c.Id);

        builder.OwnsOne(c => c.Slug, slug =>
        {
            slug.Property(s => s.Value).HasColumnName("Slug").HasMaxLength(160).IsRequired();
            slug.HasIndex(s => s.Value).IsUnique();
        });

        builder.Property(c => c.Code).HasMaxLength(64).IsRequired();
        builder.HasIndex(c => c.Code).IsUnique();

        builder.Property(c => c.DisplayOrder);
        builder.Property(c => c.IsActive);
        builder.Property(c => c.CreatedAt);
        builder.Property(c => c.UpdatedAt);

        builder.HasMany(c => c.Translations)
            .WithOne()
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(c => c.Translations).HasField("_translations").UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(c => c.DomainEvents);
    }
}
