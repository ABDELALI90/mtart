using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Categories;
using MTArt.Catalog.Domain.Collections;
using MTArt.Catalog.Domain.Colors;
using MTArt.Catalog.Domain.CustomDesigns;
using MTArt.Catalog.Domain.Finishes;
using MTArt.Catalog.Domain.Formats;
using MTArt.Catalog.Domain.Imports;
using MTArt.Catalog.Domain.Patterns;
using MTArt.Catalog.Domain.Products;
using MTArt.Catalog.Domain.Shapes;

namespace MTArt.Catalog.Infrastructure.Persistence;

public sealed class CatalogDbContext(DbContextOptions<CatalogDbContext> options) : DbContext(options), ICatalogDbContext
{
    public DbSet<ProductCategory> Categories => Set<ProductCategory>();
    public DbSet<Collection> Collections => Set<Collection>();
    public DbSet<Color> Colors => Set<Color>();
    public DbSet<Shape> Shapes => Set<Shape>();
    public DbSet<Finish> Finishes => Set<Finish>();
    public DbSet<Format> Formats => Set<Format>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<PatternCategory> PatternCategories => Set<PatternCategory>();
    public DbSet<TilePattern> TilePatterns => Set<TilePattern>();
    public DbSet<CustomTileDesign> CustomTileDesigns => Set<CustomTileDesign>();
    public DbSet<CatalogImportSession> CatalogImportSessions => Set<CatalogImportSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("catalog");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CatalogDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
