using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using MTArt.Observability.Correlation;
using MTArt.Observability.ErrorHandling;
using MTArt.Observability.HealthChecks;
using MTArt.Observability.Logging;
using MTArt.Observability.Tracing;

namespace MTArt.Observability;

/// <summary>
/// One-call composition of the cross-cutting concerns every MT ART service needs:
/// Serilog, OpenTelemetry, RFC 7807 error handling, correlation ids and health check plumbing.
/// Individual services still register their own DB/Redis/RabbitMQ health checks with the
/// "ready" tag; call <see cref="MapMtArtDefaults"/> after that to expose the endpoints.
/// </summary>
public static class ServiceDefaults
{
    public static WebApplicationBuilder AddMtArtServiceDefaults(this WebApplicationBuilder builder, string serviceName)
    {
        builder.AddMtArtLogging(serviceName);

        builder.Services.AddMtArtTelemetry(builder.Configuration, serviceName);
        builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
        builder.Services.AddProblemDetails();
        builder.Services.AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live", "ready"]);

        builder.Services.Configure<JsonOptions>(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        });

        return builder;
    }

    public static WebApplication UseMtArtServiceDefaults(this WebApplication app)
    {
        app.UseExceptionHandler();
        app.UseMtArtCorrelationId();
        app.MapMtArtHealthChecks();
        return app;
    }
}
