using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Finishes;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class FinishTranslationConfiguration : IEntityTypeConfiguration<FinishTranslation>
{
    public void Configure(EntityTypeBuilder<FinishTranslation> builder)
    {
        builder.ToTable("FinishTranslations");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.LanguageCode).HasMaxLength(5).IsRequired();
        builder.HasIndex(t => new { t.FinishId, t.LanguageCode }).IsUnique();

        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();

        builder.Ignore(t => t.DomainEvents);
    }
}
