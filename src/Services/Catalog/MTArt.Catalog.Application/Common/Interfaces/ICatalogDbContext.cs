using Microsoft.EntityFrameworkCore;
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

namespace MTArt.Catalog.Application.Common.Interfaces;

/// <summary>
/// The only thing the Application layer knows about persistence: a set of DbSets plus
/// SaveChanges. We deliberately do NOT wrap this in a generic repository - EF Core's DbSet
/// already is a fine, testable repository abstraction, and a generic wrapper around it would
/// just be ceremony (see /docs/architecture.md). Infrastructure implements this on top of the
/// real CatalogDbContext.
/// </summary>
public interface ICatalogDbContext
{
    DbSet<ProductCategory> Categories { get; }
    DbSet<Collection> Collections { get; }
    DbSet<Color> Colors { get; }
    DbSet<Shape> Shapes { get; }
    DbSet<Finish> Finishes { get; }
    DbSet<Format> Formats { get; }
    DbSet<Product> Products { get; }
    DbSet<PatternCategory> PatternCategories { get; }
    DbSet<TilePattern> TilePatterns { get; }
    DbSet<CustomTileDesign> CustomTileDesigns { get; }
    DbSet<CatalogImportSession> CatalogImportSessions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
