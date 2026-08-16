using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Colors;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class ColorConfiguration : IEntityTypeConfiguration<Color>
{
    public void Configure(EntityTypeBuilder<Color> builder)
    {
        builder.ToTable("Colors");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Code).HasMaxLength(32).IsRequired();
        builder.HasIndex(c => c.Code).IsUnique();

        builder.OwnsOne(c => c.Slug, slug =>
        {
            slug.Property(s => s.Value).HasColumnName("Slug").HasMaxLength(160).IsRequired();
            slug.HasIndex(s => s.Value).IsUnique();
        });

        builder.Property(c => c.HexApproximation).HasMaxLength(9);
        builder.Property(c => c.Family).HasConversion<string>().HasMaxLength(32);
        builder.Property(c => c.MaterialType).HasConversion<string>().HasMaxLength(32);
        builder.Property(c => c.ImageUrl).HasMaxLength(512);
        builder.Property(c => c.TextureImageUrl).HasMaxLength(512);
        builder.Property(c => c.Source).HasMaxLength(64);
        builder.Property(c => c.Rgb).HasMaxLength(32);
        builder.Property(c => c.DisplayOrder);
        builder.Property(c => c.IsActive);
        builder.Property(c => c.IsFeatured);
        builder.Property(c => c.IsDemo);
        builder.HasIndex(c => c.MaterialType);
        builder.HasIndex(c => c.IsDemo);
        builder.HasIndex(c => c.Source);
        builder.Property(c => c.CreatedAt);
        builder.Property(c => c.UpdatedAt);

        builder.HasMany(c => c.Translations)
            .WithOne()
            .HasForeignKey(t => t.ColorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(c => c.Translations).HasField("_translations").UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(c => c.DomainEvents);
    }
}
