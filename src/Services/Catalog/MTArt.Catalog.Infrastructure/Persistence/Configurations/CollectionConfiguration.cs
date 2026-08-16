using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Collections;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class CollectionConfiguration : IEntityTypeConfiguration<Collection>
{
    public void Configure(EntityTypeBuilder<Collection> builder)
    {
        builder.ToTable("Collections");
        builder.HasKey(c => c.Id);

        builder.OwnsOne(c => c.Slug, slug =>
        {
            slug.Property(s => s.Value).HasColumnName("Slug").HasMaxLength(160).IsRequired();
            slug.HasIndex(s => s.Value).IsUnique();
        });

        builder.Property(c => c.CoverImageUrl).HasMaxLength(512);
        builder.Property(c => c.DisplayOrder);
        builder.Property(c => c.IsActive);
        builder.Property(c => c.IsDemo);
        builder.Property(c => c.CreatedAt);
        builder.Property(c => c.UpdatedAt);

        builder.HasMany(c => c.Translations)
            .WithOne()
            .HasForeignKey(t => t.CollectionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(c => c.Translations).HasField("_translations").UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(c => c.DomainEvents);
    }
}
