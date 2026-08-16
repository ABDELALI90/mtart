using MTArt.Observability;

var builder = WebApplication.CreateBuilder(args);

builder.AddMtArtServiceDefaults("MTArt.Content.Api");

var app = builder.Build();

app.UseMtArtServiceDefaults();
app.UseHttpsRedirection();

// TODO(Phase 5): pages/projects/blog/FAQ/catalogs/settings endpoints - see /docs/architecture.md.
app.MapGet("/", () => Results.Ok(new { service = "MTArt.Content.Api", status = "scaffolded" }));

app.Run();

public partial class Program;
