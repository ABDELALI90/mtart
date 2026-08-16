using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Shapes;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class ShapeConfiguration : IEntityTypeConfiguration<Shape>
{
    public void Configure(EntityTypeBuilder<Shape> builder)
    {
        builder.ToTable("Shapes");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Code).HasMaxLength(32).IsRequired();
        builder.HasIndex(s => s.Code).IsUnique();

        builder.Property(s => s.DisplayOrder);
        builder.Property(s => s.IsActive);
        builder.Property(s => s.CreatedAt);
        builder.Property(s => s.UpdatedAt);

        builder.HasMany(s => s.Translations)
            .WithOne()
            .HasForeignKey(t => t.ShapeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(s => s.Translations).HasField("_translations").UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(s => s.DomainEvents);
    }
}
