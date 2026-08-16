using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Infrastructure.Persistence;

namespace MTArt.Catalog.UnitTests.Common;

/// <summary>
/// Each test gets its own isolated EF Core InMemory database (unique per Guid), so handler
/// tests exercise the real CatalogDbContext/entity configurations without needing SQL Server.
/// </summary>
public static class InMemoryCatalogDbContextFactory
{
    public static CatalogDbContext Create()
    {
        var options = new DbContextOptionsBuilder<CatalogDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .EnableSensitiveDataLogging()
            .Options;

        return new CatalogDbContext(options);
    }
}
