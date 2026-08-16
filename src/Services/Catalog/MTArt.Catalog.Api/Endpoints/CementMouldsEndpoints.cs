using Microsoft.AspNetCore.Mvc;
using MTArt.Catalog.Application.Patterns.Commands.CreateCementMould;
using MTArt.Catalog.Application.Patterns.Commands.PublishCementMould;
using MTArt.Catalog.Application.Patterns.Commands.UpdateCementMould;
using MTArt.Catalog.Application.Patterns.Dtos;
using MTArt.Catalog.Application.Patterns.Queries.GetCementMould;
using MTArt.Catalog.Application.Patterns.Queries.GetCementMouldRegions;
using MTArt.Catalog.Application.Patterns.Queries.GetCementMoulds;
using MTArt.Catalog.Application.Patterns.Queries.GetPatternCategories;
using MTArt.Observability.ErrorHandling;
using MTArt.SharedKernel.Cqrs;

namespace MTArt.Catalog.Api.Endpoints;

public static class CementMouldsEndpoints
{
    public static IEndpointRouteBuilder MapCementMouldsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/catalog/cement-moulds").WithTags("CementMoulds");
        group.MapGet("/", GetAll).WithName("GetCementMoulds");
        group.MapGet("/categories", GetCategories).WithName("GetCementMouldCategories");
        group.MapGet("/{reference}/regions", GetRegions).WithName("GetCementMouldRegions");
        group.MapGet("/{reference}", GetByReference).WithName("GetCementMouldByReference");
        group.MapPost("/", Create).WithName("CreateCementMould");
        group.MapPut("/{id:guid}", Update).WithName("UpdateCementMould");
        group.MapPost("/{id:guid}/publish", Publish).WithName("PublishCementMould");
        return app;
    }

    private static async Task<IResult> GetAll(
        ISender sender, HttpContext httpContext,
        [FromQuery] string lang = "en",
        [FromQuery] string? category = null,
        [FromQuery] string? search = null,
        [FromQuery] string? q = null,
        [FromQuery] int? regions = null,
        [FromQuery] bool simulatorReady = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100,
        [FromQuery] string? family = null,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new GetCementMouldsQuery(lang, category, search ?? q, regions, simulatorReady, page, pageSize, family),
            cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetCategories(
        ISender sender, HttpContext httpContext, [FromQuery] string lang = "en", CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetPatternCategoriesQuery(lang), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetByReference(
        ISender sender, HttpContext httpContext, string reference, [FromQuery] string lang = "en",
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetCementMouldQuery(reference, lang), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetRegions(
        ISender sender, HttpContext httpContext, string reference, CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetCementMouldRegionsQuery(reference), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> Create(
        ISender sender, HttpContext httpContext, [FromBody] CreateCementMouldCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.IsSuccess ? Results.Created($"/api/v1/catalog/cement-moulds/{result.Value}", new { id = result.Value }) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> Update(
        ISender sender, HttpContext httpContext, Guid id, [FromBody] UpdateCementMouldBody body,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new UpdateCementMouldCommand(
                id, body.Reference, body.Slug, body.Name, body.CategoryId, body.FormatId,
                body.PreviewImageUrl, body.VectorAssetUrl, body.IsSimulatorReady, body.IsActive,
                body.DisplayOrder, body.Regions),
            cancellationToken);
        return result.IsSuccess ? Results.NoContent() : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> Publish(
        ISender sender, HttpContext httpContext, Guid id, [FromBody] PublishCementMouldBody body,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new PublishCementMouldCommand(id, body.IsSimulatorReady, body.IsActive), cancellationToken);
        return result.IsSuccess ? Results.NoContent() : result.ToProblemResult(httpContext);
    }
}

public sealed record UpdateCementMouldBody(
    string Reference,
    string Slug,
    string Name,
    Guid CategoryId,
    Guid? FormatId,
    string? PreviewImageUrl,
    string? VectorAssetUrl,
    bool IsSimulatorReady,
    bool IsActive,
    int DisplayOrder,
    IReadOnlyList<CementMouldRegionInput> Regions);

public sealed record PublishCementMouldBody(bool IsSimulatorReady, bool IsActive);
