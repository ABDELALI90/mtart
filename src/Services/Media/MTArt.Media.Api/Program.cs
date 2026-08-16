using MTArt.Observability;

var builder = WebApplication.CreateBuilder(args);

builder.AddMtArtServiceDefaults("MTArt.Media.Api");

var app = builder.Build();

app.UseMtArtServiceDefaults();
app.UseHttpsRedirection();

// TODO(Phase 7): upload/variants/thumbnails/IFileStorage (local fs in dev, S3/Blob in prod) - see /docs/architecture.md.
app.MapGet("/", () => Results.Ok(new { service = "MTArt.Media.Api", status = "scaffolded" }));

app.Run();

public partial class Program;
