using Microsoft.AspNetCore.Mvc;
using MTArt.Catalog.Application.Categories.Queries.GetCategories;
using MTArt.Catalog.Application.Categories.Queries.GetCategoryBySlug;
using MTArt.Observability.ErrorHandling;
using MTArt.SharedKernel.Cqrs;

namespace MTArt.Catalog.Api.Endpoints;

public static class CategoriesEndpoints
{
    public static IEndpointRouteBuilder MapCategoriesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/catalog/categories").WithTags("Categories");

        group.MapGet("/", GetAll).WithName("GetCategories").WithSummary("List all categories.");
        group.MapGet("/{slug}", GetBySlug).WithName("GetCategoryBySlug").WithSummary("Get a single category by slug.");

        return app;
    }

    private static async Task<IResult> GetAll(
        ISender sender, HttpContext httpContext, [FromQuery] string lang = "en", [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetCategoriesQuery(lang, activeOnly), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetBySlug(
        ISender sender, HttpContext httpContext, string slug, [FromQuery] string lang = "en", CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetCategoryBySlugQuery(slug, lang), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }
}
