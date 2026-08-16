using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Products.Dtos;
using MTArt.Catalog.Application.Products.Queries.GetProducts;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Queries.GetFeaturedProducts;

/// <summary>Thin wrapper over GetProductsQuery - the homepage "Featured Collections" rail is just products sorted by Featured, first page.</summary>
public sealed class GetFeaturedProductsQueryHandler(ISender sender)
    : IRequestHandler<GetFeaturedProductsQuery, Result<IReadOnlyList<ProductListItemDto>>>
{
    public async Task<Result<IReadOnlyList<ProductListItemDto>>> Handle(GetFeaturedProductsQuery request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetProductsQuery(
                request.LanguageCode, null, null, null, null, null, null, null, null, null,
                ProductSortOrder.Featured, 1, request.Count),
            cancellationToken);

        if (result.IsFailure)
        {
            return Result.Failure<IReadOnlyList<ProductListItemDto>>(result.Error);
        }

        return Result.Success<IReadOnlyList<ProductListItemDto>>(result.Value.Items);
    }
}
