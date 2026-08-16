using Microsoft.AspNetCore.Mvc;
using MTArt.Catalog.Application.Imports;
using MTArt.Observability.ErrorHandling;
using MTArt.SharedKernel.Cqrs;

namespace MTArt.Catalog.Api.Endpoints;

public static class ImportsEndpoints
{
    public static IEndpointRouteBuilder MapImportsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/catalog/imports").WithTags("Imports");
        group.MapGet("/status", GetStatus).WithName("GetCatalogImportStatus");
        group.MapGet("/inventory", GetInventory).WithName("GetCatalogAssetInventory");
        group.MapGet("/preview", GetPreview).WithName("GetCatalogImportPreview");
        group.MapGet("/errors", GetErrors).WithName("GetCatalogImportErrors");
        group.MapPost("/analyze", Analyze).WithName("AnalyzeCatalog");
        group.MapPost("/confirm", Confirm).WithName("ConfirmCatalogImport");
        group.MapPost("/products", ImportProducts).WithName("ImportCatalogProducts");
        group.MapPost("/cancel", Cancel).WithName("CancelCatalogImport");
        group.MapPut("/pages/{pageId:guid}", UpdatePage).WithName("UpdateCatalogImportPage");
        return app;
    }

    private static async Task<IResult> GetStatus(ISender sender, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCatalogImportStatusQuery(), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetInventory(ISender sender, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAssetInventoryQuery(), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetPreview(ISender sender, HttpContext httpContext, [FromQuery] Guid? sessionId, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCatalogImportPreviewQuery(sessionId), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetErrors(ISender sender, HttpContext httpContext, [FromQuery] Guid? sessionId, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCatalogImportErrorsQuery(sessionId), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> Analyze(ISender sender, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new AnalyzeCatalogCommand(), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> Confirm(ISender sender, HttpContext httpContext, [FromQuery] Guid? sessionId, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ConfirmCatalogImportCommand(sessionId), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> ImportProducts(ISender sender, HttpContext httpContext, [FromQuery] Guid? sessionId, CancellationToken cancellationToken)
        => await Confirm(sender, httpContext, sessionId, cancellationToken);

    private static async Task<IResult> Cancel(ISender sender, HttpContext httpContext, [FromQuery] Guid? sessionId, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CancelCatalogImportCommand(sessionId), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> UpdatePage(
        ISender sender, HttpContext httpContext, Guid pageId, [FromBody] UpdateCatalogImportPageCommand body, CancellationToken cancellationToken)
    {
        var command = body with { PageId = pageId };
        var result = await sender.Send(command, cancellationToken);
        return result.IsSuccess ? Results.NoContent() : result.ToProblemResult(httpContext);
    }
}
