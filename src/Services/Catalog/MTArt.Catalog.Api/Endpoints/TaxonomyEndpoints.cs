using Microsoft.AspNetCore.Mvc;
using MTArt.Catalog.Application.Colors.Queries.GetColorBySlug;
using MTArt.Catalog.Application.Colors.Queries.GetColors;
using MTArt.Catalog.Application.Finishes.Queries.GetFinishes;
using MTArt.Catalog.Application.Formats.Queries.GetFormats;
using MTArt.Catalog.Application.Shapes.Queries.GetShapes;
using MTArt.Catalog.Domain;
using MTArt.Observability.ErrorHandling;
using MTArt.SharedKernel.Cqrs;

namespace MTArt.Catalog.Api.Endpoints;

/// <summary>Small reference/taxonomy lists (colors, formats, shapes, finishes) - each cheap enough to not warrant its own file.</summary>
public static class TaxonomyEndpoints
{
    public static IEndpointRouteBuilder MapTaxonomyEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/catalog/colors", GetColors).WithTags("Colors").WithName("GetColors").WithSummary("List all colors.");
        app.MapGet("/api/v1/catalog/colors/{slug}", GetColorBySlug).WithTags("Colors").WithName("GetColorBySlug");
        app.MapGet("/api/v1/catalog/formats", GetFormats).WithTags("Formats").WithName("GetFormats").WithSummary("List all formats.");
        app.MapGet("/api/v1/catalog/shapes", GetShapes).WithTags("Shapes").WithName("GetShapes").WithSummary("List all shapes.");
        app.MapGet("/api/v1/catalog/finishes", GetFinishes).WithTags("Finishes").WithName("GetFinishes").WithSummary("List all finishes.");

        return app;
    }

    private static async Task<IResult> GetColors(
        ISender sender, HttpContext httpContext, [FromQuery] string lang = "en", [FromQuery] string? family = null,
        [FromQuery] string? materialType = null, [FromQuery] string? material = null, [FromQuery] bool activeOnly = true,
        [FromQuery] string? source = null, CancellationToken cancellationToken = default)
    {
        ColorFamily? parsedFamily = Enum.TryParse<ColorFamily>(family, true, out var familyValue) ? familyValue : null;
        var materialValue = materialType ?? material;
        MaterialType? parsedMaterial = Enum.TryParse<MaterialType>(materialValue, true, out var materialEnum) ? materialEnum : null;
        var result = await sender.Send(new GetColorsQuery(lang, parsedFamily, activeOnly, parsedMaterial, Source: source), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetColorBySlug(
        ISender sender, HttpContext httpContext, string slug, [FromQuery] string lang = "en", CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetColorBySlugQuery(slug, lang), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetFormats(
        ISender sender, HttpContext httpContext, [FromQuery] string lang = "en", [FromQuery] Guid? shapeId = null,
        [FromQuery] bool activeOnly = true, [FromQuery] MaterialType? materialType = null, CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetFormatsQuery(lang, shapeId, activeOnly, materialType), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetShapes(
        ISender sender, HttpContext httpContext, [FromQuery] string lang = "en", CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetShapesQuery(lang), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetFinishes(
        ISender sender, HttpContext httpContext, [FromQuery] string lang = "en", CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetFinishesQuery(lang), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }
}
