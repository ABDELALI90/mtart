using MTArt.Observability;

var builder = WebApplication.CreateBuilder(args);

builder.AddMtArtServiceDefaults("MTArt.ApiGateway");

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ??
    ["http://localhost:5173", "http://127.0.0.1:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy => policy
        .SetIsOriginAllowed(origin => IsAllowedWebOrigin(origin, allowedOrigins))
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

app.UseMtArtServiceDefaults();
app.UseCors("Default");

// HTTP-only in Docker and local dev. HTTPS redirection would send the React app
// from http://localhost:8080 to https://localhost:8080, which is not bound.

// Every public/admin API call from the React app goes through this single entry point -
// individual services are never exposed directly to the browser (see /docs/architecture.md).
app.MapReverseProxy();

app.Run();

static bool IsAllowedWebOrigin(string origin, string[] allowed)
{
    if (allowed.Contains(origin, StringComparer.OrdinalIgnoreCase))
    {
        return true;
    }

    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
    {
        return false;
    }

    if (uri.Scheme is not ("http" or "https"))
    {
        return false;
    }

    // Vite moves to 5174+ when 5173 is already bound.
    return uri.Host is "localhost" or "127.0.0.1" && uri.Port is >= 5173 and <= 5199;
}
