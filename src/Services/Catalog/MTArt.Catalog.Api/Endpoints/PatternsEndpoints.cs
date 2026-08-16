using Microsoft.AspNetCore.Mvc;
using MTArt.Catalog.Application.Patterns.Queries.GetPatternBySlug;
using MTArt.Catalog.Application.Patterns.Queries.GetPatternCategories;
using MTArt.Catalog.Application.Patterns.Queries.GetPatterns;
using MTArt.Observability.ErrorHandling;
using MTArt.SharedKernel.Cqrs;

namespace MTArt.Catalog.Api.Endpoints;

public static class PatternsEndpoints
{
    public static IEndpointRouteBuilder MapPatternsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/catalog/patterns").WithTags("Patterns");
        group.MapGet("/", GetAll).WithName("GetPatterns");
        group.MapGet("/categories", GetCategories).WithName("GetPatternCategories");
        group.MapGet("/{slug}", GetBySlug).WithName("GetPatternBySlug");
        return app;
    }

    private static async Task<IResult> GetAll(
        ISender sender, HttpContext httpContext, [FromQuery] string lang = "en",
        [FromQuery] string? category = null, [FromQuery] string? q = null,
        [FromQuery] int? regions = null, [FromQuery] bool simulatorReady = false,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetPatternsQuery(lang, category, q, regions, simulatorReady), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetCategories(
        ISender sender, HttpContext httpContext, [FromQuery] string lang = "en", CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetPatternCategoriesQuery(lang), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetBySlug(
        ISender sender, HttpContext httpContext, string slug, [FromQuery] string lang = "en", CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetPatternBySlugQuery(slug, lang), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }
}
