using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace MTArt.Observability.HealthChecks;

public static class HealthCheckExtensions
{
    /// <summary>
    /// Maps the 3 conventional health endpoints:
    /// /health        - everything (for humans / dashboards)
    /// /health/ready  - readiness (dependencies such as DB/Redis/RabbitMQ must be up)
    /// /health/live   - liveness (process is alive; excludes external dependencies)
    /// </summary>
    public static IEndpointRouteBuilder MapMtArtHealthChecks(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHealthChecks("/health", new HealthCheckOptions { ResponseWriter = WriteJsonResponse });

        endpoints.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains("ready"),
            ResponseWriter = WriteJsonResponse,
        });

        endpoints.MapHealthChecks("/health/live", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains("live"),
            ResponseWriter = WriteJsonResponse,
        });

        return endpoints;
    }

    private static Task WriteJsonResponse(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";

        var payload = JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                description = entry.Value.Description,
            }),
            totalDurationMs = report.TotalDuration.TotalMilliseconds,
        });

        return context.Response.WriteAsync(payload);
    }
}
