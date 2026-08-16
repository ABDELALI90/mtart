using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Patterns;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class PatternCategoryConfiguration : IEntityTypeConfiguration<PatternCategory>
{
    public void Configure(EntityTypeBuilder<PatternCategory> builder)
    {
        builder.ToTable("PatternCategories");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Code).HasMaxLength(64).IsRequired();
        builder.HasIndex(c => c.Code).IsUnique();
        builder.OwnsOne(c => c.Slug, slug =>
        {
            slug.Property(s => s.Value).HasColumnName("Slug").HasMaxLength(160).IsRequired();
            slug.HasIndex(s => s.Value).IsUnique();
        });
        builder.HasMany(c => c.Translations).WithOne().HasForeignKey(t => t.PatternCategoryId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(c => c.Translations).HasField("_translations").UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.Ignore(c => c.DomainEvents);
    }
}

public sealed class PatternCategoryTranslationConfiguration : IEntityTypeConfiguration<PatternCategoryTranslation>
{
    public void Configure(EntityTypeBuilder<PatternCategoryTranslation> builder)
    {
        builder.ToTable("PatternCategoryTranslations");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.LanguageCode).HasMaxLength(8).IsRequired();
        builder.Property(t => t.Name).HasMaxLength(160).IsRequired();
        builder.HasIndex(t => new { t.PatternCategoryId, t.LanguageCode }).IsUnique();
        builder.Ignore(t => t.DomainEvents);
    }
}

public sealed class TilePatternConfiguration : IEntityTypeConfiguration<TilePattern>
{
    public void Configure(EntityTypeBuilder<TilePattern> builder)
    {
        builder.ToTable("TilePatterns");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Reference).HasMaxLength(64).IsRequired();
        builder.HasIndex(p => p.Reference).IsUnique();
        builder.OwnsOne(p => p.Slug, slug =>
        {
            slug.Property(s => s.Value).HasColumnName("Slug").HasMaxLength(160).IsRequired();
            slug.HasIndex(s => s.Value).IsUnique();
        });
        builder.Property(p => p.BasePreviewImageUrl).HasMaxLength(512);
        builder.Property(p => p.VectorAssetUrl).HasMaxLength(512);
        builder.HasIndex(p => p.CategoryId);
        builder.HasIndex(p => p.IsSimulatorReady);
        builder.HasMany(p => p.Translations).WithOne().HasForeignKey(t => t.PatternId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(p => p.Translations).HasField("_translations").UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.HasMany(p => p.Regions).WithOne().HasForeignKey(r => r.PatternId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(p => p.Regions).HasField("_regions").UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.Ignore(p => p.DomainEvents);
    }
}

public sealed class TilePatternTranslationConfiguration : IEntityTypeConfiguration<TilePatternTranslation>
{
    public void Configure(EntityTypeBuilder<TilePatternTranslation> builder)
    {
        builder.ToTable("TilePatternTranslations");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.LanguageCode).HasMaxLength(8).IsRequired();
        builder.Property(t => t.Name).HasMaxLength(160).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(2000);
        builder.HasIndex(t => new { t.PatternId, t.LanguageCode }).IsUnique();
        builder.Ignore(t => t.DomainEvents);
    }
}

public sealed class TilePatternRegionConfiguration : IEntityTypeConfiguration<TilePatternRegion>
{
    public void Configure(EntityTypeBuilder<TilePatternRegion> builder)
    {
        builder.ToTable("TilePatternRegions");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.RegionKey).HasMaxLength(64).IsRequired();
        builder.Property(r => r.DisplayName).HasMaxLength(128).IsRequired();
        builder.HasIndex(r => new { r.PatternId, r.RegionKey }).IsUnique();
        builder.Ignore(r => r.DomainEvents);
    }
}
