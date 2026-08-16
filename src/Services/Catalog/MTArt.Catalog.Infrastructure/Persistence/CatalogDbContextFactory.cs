using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MTArt.Catalog.Infrastructure.Persistence;

/// <summary>
/// Design-time factory so `dotnet ef migrations add` works from the Infrastructure project
/// without needing to spin up the full Api host / real configuration.
/// </summary>
public sealed class CatalogDbContextFactory : IDesignTimeDbContextFactory<CatalogDbContext>
{
    public CatalogDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<CatalogDbContext>();
        optionsBuilder.UseSqlServer(
            "Server=localhost,1433;Database=MTArt.Catalog;User Id=sa;Password=Placeholder_ChangeMe123!;TrustServerCertificate=True;",
            sql => sql.MigrationsAssembly(typeof(CatalogDbContext).Assembly.FullName));

        return new CatalogDbContext(optionsBuilder.Options);
    }
}
