using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Formats;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class FormatConfiguration : IEntityTypeConfiguration<Format>
{
    public void Configure(EntityTypeBuilder<Format> builder)
    {
        builder.ToTable("Formats");
        builder.HasKey(f => f.Id);

        builder.Property(f => f.Reference).HasMaxLength(32).IsRequired();
        builder.HasIndex(f => f.Reference).IsUnique();

        builder.Property(f => f.WidthCm).HasColumnType("decimal(8,2)");
        builder.Property(f => f.HeightCm).HasColumnType("decimal(8,2)");
        builder.Property(f => f.ThicknessCm).HasColumnType("decimal(6,2)");
        builder.Property(f => f.UnitsPerM2).HasColumnType("decimal(8,2)");
        builder.Property(f => f.WeightPerUnitKg).HasColumnType("decimal(8,3)");
        builder.Property(f => f.WeightPerM2Kg).HasColumnType("decimal(8,2)");

        builder.Property(f => f.ShapeId);
        builder.HasIndex(f => f.ShapeId);

        builder.Property(f => f.DisplayOrder);
        builder.Property(f => f.IsActive);
        builder.Property(f => f.MaterialType).HasConversion<string>().HasMaxLength(32);
        builder.Property(f => f.HasVerifiedTechnicalData);
        builder.HasIndex(f => f.MaterialType);
        builder.Property(f => f.CreatedAt);
        builder.Property(f => f.UpdatedAt);

        builder.HasMany(f => f.Translations)
            .WithOne()
            .HasForeignKey(t => t.FormatId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(f => f.Translations).HasField("_translations").UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(f => f.DomainEvents);
    }
}
