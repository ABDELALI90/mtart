using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.CustomDesigns;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class CustomTileDesignConfiguration : IEntityTypeConfiguration<CustomTileDesign>
{
    public void Configure(EntityTypeBuilder<CustomTileDesign> builder)
    {
        builder.ToTable("CustomTileDesigns");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Reference).HasMaxLength(32).IsRequired();
        builder.HasIndex(d => d.Reference).IsUnique();
        builder.Property(d => d.Name).HasMaxLength(160).IsRequired();
        builder.Property(d => d.WidthCm).HasPrecision(6, 2);
        builder.Property(d => d.HeightCm).HasPrecision(6, 2);
        builder.Property(d => d.Unit).HasMaxLength(8).IsRequired();
        builder.Property(d => d.GeometryJson).HasColumnType("nvarchar(max)").IsRequired();
        builder.Property(d => d.SvgMarkup).HasColumnType("nvarchar(max)").IsRequired();
        builder.Property(d => d.ThumbnailSvg).HasColumnType("nvarchar(max)");
        builder.Property(d => d.RepeatMode).HasMaxLength(32).IsRequired();
        builder.Property(d => d.ColorSummaryJson).HasColumnType("nvarchar(max)");
        builder.HasIndex(d => d.CreatedAt);
        builder.Ignore(d => d.DomainEvents);
    }
}
