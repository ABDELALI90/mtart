using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Shapes;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class ShapeTranslationConfiguration : IEntityTypeConfiguration<ShapeTranslation>
{
    public void Configure(EntityTypeBuilder<ShapeTranslation> builder)
    {
        builder.ToTable("ShapeTranslations");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.LanguageCode).HasMaxLength(5).IsRequired();
        builder.HasIndex(t => new { t.ShapeId, t.LanguageCode }).IsUnique();

        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();

        builder.Ignore(t => t.DomainEvents);
    }
}
