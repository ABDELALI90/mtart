using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Formats;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class FormatTranslationConfiguration : IEntityTypeConfiguration<FormatTranslation>
{
    public void Configure(EntityTypeBuilder<FormatTranslation> builder)
    {
        builder.ToTable("FormatTranslations");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.LanguageCode).HasMaxLength(5).IsRequired();
        builder.HasIndex(t => new { t.FormatId, t.LanguageCode }).IsUnique();

        builder.Property(t => t.Name).HasMaxLength(200);
        builder.Property(t => t.Description).HasMaxLength(1000);

        builder.Ignore(t => t.DomainEvents);
    }
}
