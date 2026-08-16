using MTArt.Observability;

var builder = WebApplication.CreateBuilder(args);

builder.AddMtArtServiceDefaults("MTArt.Identity.Api");

var app = builder.Build();

app.UseMtArtServiceDefaults();
app.UseHttpsRedirection();

// TODO(Phase 7): ASP.NET Core Identity, JWT auth, refresh tokens, role management
// (SuperAdmin/Admin/ContentManager/CatalogManager/SalesManager/Viewer) - see /docs/architecture.md.
app.MapGet("/", () => Results.Ok(new { service = "MTArt.Identity.Api", status = "scaffolded" }));

app.Run();

public partial class Program;
