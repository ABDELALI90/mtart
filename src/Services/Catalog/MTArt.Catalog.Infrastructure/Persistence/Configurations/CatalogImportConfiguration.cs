using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Imports;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class CatalogImportSessionConfiguration : IEntityTypeConfiguration<CatalogImportSession>
{
    public void Configure(EntityTypeBuilder<CatalogImportSession> builder)
    {
        builder.ToTable("CatalogImportSessions");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.SourceCatalog).HasMaxLength(256).IsRequired();
        builder.Property(s => s.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(s => s.ErrorSummary).HasMaxLength(2000);
        builder.HasMany(s => s.Pages).WithOne().HasForeignKey(p => p.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(s => s.Pages).HasField("_pages").UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.Ignore(s => s.DomainEvents);
    }
}

public sealed class CatalogImportPageConfiguration : IEntityTypeConfiguration<CatalogImportPage>
{
    public void Configure(EntityTypeBuilder<CatalogImportPage> builder)
    {
        builder.ToTable("CatalogImportPages");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.ImportId).HasMaxLength(32).IsRequired();
        builder.Property(p => p.Classification).HasConversion<string>().HasMaxLength(32);
        builder.Property(p => p.SuggestedName).HasMaxLength(256);
        builder.Property(p => p.SuggestedReference).HasMaxLength(64);
        builder.Property(p => p.SuggestedCategory).HasMaxLength(64);
        builder.Property(p => p.DetectedShape).HasMaxLength(32);
        builder.Property(p => p.ExtractedPrice).HasColumnType("decimal(10,2)");
        builder.Property(p => p.PriceUnit).HasMaxLength(8);
        builder.Property(p => p.ImageUrl).HasMaxLength(512);
        builder.Property(p => p.DominantColors).HasMaxLength(256);
        builder.HasIndex(p => p.SessionId);
        builder.HasIndex(p => p.ImportId);
        builder.Ignore(p => p.DomainEvents);
    }
}
