using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Colors;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class ColorTranslationConfiguration : IEntityTypeConfiguration<ColorTranslation>
{
    public void Configure(EntityTypeBuilder<ColorTranslation> builder)
    {
        builder.ToTable("ColorTranslations");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.LanguageCode).HasMaxLength(5).IsRequired();
        builder.HasIndex(t => new { t.ColorId, t.LanguageCode }).IsUnique();

        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(2000);

        builder.Ignore(t => t.DomainEvents);
    }
}
