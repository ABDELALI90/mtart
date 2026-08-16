using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Collections;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class CollectionTranslationConfiguration : IEntityTypeConfiguration<CollectionTranslation>
{
    public void Configure(EntityTypeBuilder<CollectionTranslation> builder)
    {
        builder.ToTable("CollectionTranslations");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.LanguageCode).HasMaxLength(5).IsRequired();
        builder.HasIndex(t => new { t.CollectionId, t.LanguageCode }).IsUnique();

        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Story).HasMaxLength(4000);
        builder.Property(t => t.Description).HasMaxLength(4000);
        builder.Property(t => t.SeoTitle).HasMaxLength(160);
        builder.Property(t => t.SeoDescription).HasMaxLength(320);

        builder.Ignore(t => t.DomainEvents);
    }
}
