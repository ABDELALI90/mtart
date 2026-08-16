using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Api.Endpoints;
using MTArt.Catalog.Application;
using MTArt.Catalog.Infrastructure;
using MTArt.Catalog.Infrastructure.Persistence;
using MTArt.Catalog.Infrastructure.Persistence.Seed;
using MTArt.Observability;

var builder = WebApplication.CreateBuilder(args);

builder.AddMtArtServiceDefaults("MTArt.Catalog.Api");

builder.Services.AddCatalogApplication();
builder.Services.AddCatalogInfrastructure(builder.Configuration);
builder.Services.Configure<MTArt.Catalog.Application.Common.Options.ManufacturingOptions>(
    builder.Configuration.GetSection(MTArt.Catalog.Application.Common.Options.ManufacturingOptions.SectionName));
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<MTArt.Catalog.Application.Common.Options.ManufacturingOptions>>().Value);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "MT ART Catalog API",
        Version = "v1",
        Description = "Product categories, collections, colors, formats, shapes, finishes and products.",
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy => policy
        .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ??
            ["http://localhost:5173", "http://127.0.0.1:5173"])
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddHealthChecks()
    .AddDbContextCheck<CatalogDbContext>(name: "catalog-db", tags: ["ready"]);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", "MT ART Catalog API v1"));

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
    await db.Database.MigrateAsync();
    await CatalogSeeder.SeedWithRealCatalogAsync(db, scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("CatalogSeeder"));
}

app.UseMtArtServiceDefaults();

app.UseCors("Default");
// HTTP-only in Docker and local `dotnet run`. HTTPS redirection would 307 the
// YARP gateway (and Swagger) to an HTTPS URL that is not bound.

app.MapProductsEndpoints();
app.MapCategoriesEndpoints();
app.MapCollectionsEndpoints();
app.MapTaxonomyEndpoints();
app.MapPatternsEndpoints();
app.MapCementMouldsEndpoints();
app.MapCustomDesignsEndpoints();
app.MapImportsEndpoints();

app.Run();

public partial class Program;
