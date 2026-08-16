using Microsoft.AspNetCore.Mvc;
using MTArt.Catalog.Application.Collections.Queries.GetCollectionBySlug;
using MTArt.Catalog.Application.Collections.Queries.GetCollections;
using MTArt.Observability.ErrorHandling;
using MTArt.SharedKernel.Cqrs;

namespace MTArt.Catalog.Api.Endpoints;

public static class CollectionsEndpoints
{
    public static IEndpointRouteBuilder MapCollectionsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/catalog/collections").WithTags("Collections");

        group.MapGet("/", GetAll).WithName("GetCollections").WithSummary("List all collections.");
        group.MapGet("/{slug}", GetBySlug).WithName("GetCollectionBySlug").WithSummary("Get a single collection by slug.");

        return app;
    }

    private static async Task<IResult> GetAll(
        ISender sender, HttpContext httpContext, [FromQuery] string lang = "en", [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetCollectionsQuery(lang, activeOnly), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetBySlug(
        ISender sender, HttpContext httpContext, string slug, [FromQuery] string lang = "en", CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetCollectionBySlugQuery(slug, lang), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }
}
