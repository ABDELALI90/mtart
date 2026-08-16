using Microsoft.AspNetCore.Mvc;
using MTArt.Catalog.Application.Products.Dtos;
using MTArt.Catalog.Application.Products.Queries.GetFeaturedProducts;
using MTArt.Catalog.Application.Products.Queries.GetProductBySlug;
using MTArt.Catalog.Application.Products.Queries.GetProducts;
using MTArt.Catalog.Application.Products.Queries.SearchProducts;
using MTArt.Observability.ErrorHandling;
using MTArt.SharedKernel.Cqrs;

namespace MTArt.Catalog.Api.Endpoints;

public static class ProductsEndpoints
{
    public static IEndpointRouteBuilder MapProductsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/catalog/products").WithTags("Products");

        group.MapGet("/", GetProducts).WithName("GetProducts").WithSummary("List/filter/paginate products.");
        group.MapGet("/featured", GetFeatured).WithName("GetFeaturedProducts").WithSummary("Get featured products.");
        group.MapGet("/search", Search).WithName("SearchProducts").WithSummary("Search products by reference/name.");
        group.MapGet("/{slug}", GetBySlug).WithName("GetProductBySlug").WithSummary("Get a single product by slug.");

        return app;
    }

    private static async Task<IResult> GetProducts(
        ISender sender, HttpContext httpContext, [FromQuery] string lang = "en",
        [FromQuery] string? category = null, [FromQuery] string? collection = null,
        [FromQuery] Guid? color = null, [FromQuery] Guid? shape = null, [FromQuery] Guid? format = null, [FromQuery] Guid? finish = null,
        [FromQuery] bool? inStock = null, [FromQuery] bool? customizable = null, [FromQuery] string? q = null,
        [FromQuery] ProductSortOrder sort = ProductSortOrder.Featured, [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? kind = null,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new GetProductsQuery(lang, category, collection, color, shape, format, finish, inStock, customizable, q, sort, page, pageSize, false, kind),
            cancellationToken);

        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetFeatured(
        ISender sender, HttpContext httpContext, [FromQuery] string lang = "en", [FromQuery] int count = 8,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetFeaturedProductsQuery(lang, count), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> Search(
        ISender sender, HttpContext httpContext, [FromQuery] string q, [FromQuery] string lang = "en", [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Results.Ok(Array.Empty<ProductListItemDto>());
        }

        var result = await sender.Send(new SearchProductsQuery(q, lang, limit), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }

    private static async Task<IResult> GetBySlug(
        ISender sender, HttpContext httpContext, string slug, [FromQuery] string lang = "en", CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetProductBySlugQuery(slug, lang), cancellationToken);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemResult(httpContext);
    }
}
