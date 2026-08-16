using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MTArt.Catalog.Domain.Finishes;

namespace MTArt.Catalog.Infrastructure.Persistence.Configurations;

public sealed class FinishConfiguration : IEntityTypeConfiguration<Finish>
{
    public void Configure(EntityTypeBuilder<Finish> builder)
    {
        builder.ToTable("Finishes");
        builder.HasKey(f => f.Id);

        builder.Property(f => f.Code).HasMaxLength(32).IsRequired();
        builder.HasIndex(f => f.Code).IsUnique();

        builder.Property(f => f.DisplayOrder);
        builder.Property(f => f.IsActive);
        builder.Property(f => f.CreatedAt);
        builder.Property(f => f.UpdatedAt);

        builder.HasMany(f => f.Translations)
            .WithOne()
            .HasForeignKey(t => t.FinishId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(f => f.Translations).HasField("_translations").UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(f => f.DomainEvents);
    }
}
