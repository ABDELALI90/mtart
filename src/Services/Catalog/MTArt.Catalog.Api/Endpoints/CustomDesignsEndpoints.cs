using Microsoft.AspNetCore.Mvc;
using MTArt.Catalog.Application.CustomDesigns.Commands.SaveCustomDesign;
using MTArt.Catalog.Application.CustomDesigns.Commands.UpdateCustomDesign;
using MTArt.Catalog.Application.CustomDesigns.Queries.GetCustomDesign;
using MTArt.Catalog.Application.CustomDesigns.Queries.GetCustomDesigns;
using MTArt.Catalog.Application.CustomDesigns.Queries.GetManufacturingSettings;
using MTArt.Observability.ErrorHandling;
using MTArt.SharedKernel.Cqrs;

namespace MTArt.Catalog.Api.Endpoints;

public static class CustomDesignsEndpoints
{
    public static IEndpointRouteBuilder MapCustomDesignsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/catalog/custom-designs").WithTags("CustomDesigns");
        group.MapGet("/", GetAll).WithName("GetCustomDesigns");
        group.MapGet("/manufacturing-settings", GetSettings).WithName("GetManufacturingSettings");
        group.MapGet("/{reference}", GetByReference).WithName("GetCustomDesignByReference");
        group.MapPost("/", Create).WithName("CreateCustomDesign");
        group.MapPut("/{id:guid}", Update).WithName("UpdateCustomDesign");
        return app;
    }

    private static async Task<IResult> GetAll(
        ISender sender,
        HttpContext httpContext,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetCustomDesignsQuery(page, pageSize), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetSettings(
        ISender sender,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetManufacturingSettingsQuery(), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetByReference(
        ISender sender,
        HttpContext httpContext,
        string reference,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetCustomDesignQuery(reference), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> Create(
        ISender sender,
        HttpContext httpContext,
        [FromBody] SaveCustomDesignCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.IsSuccess
            ? Results.Created($"/api/v1/catalog/custom-designs/{result.Value.Reference}", result.Value)
            : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> Update(
        ISender sender,
        HttpContext httpContext,
        Guid id,
        [FromBody] UpdateCustomDesignBody body,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new UpdateCustomDesignCommand(
                id,
                body.Name,
                body.WidthCm,
                body.HeightCm,
                body.GeometryJson,
                body.SvgMarkup,
                body.ThumbnailSvg,
                body.RepeatMode,
                body.ColorSummaryJson),
            cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }
}

public sealed record UpdateCustomDesignBody(
    string Name,
    decimal WidthCm,
    decimal HeightCm,
    string GeometryJson,
    string SvgMarkup,
    string? ThumbnailSvg,
    string RepeatMode,
    string? ColorSummaryJson);
