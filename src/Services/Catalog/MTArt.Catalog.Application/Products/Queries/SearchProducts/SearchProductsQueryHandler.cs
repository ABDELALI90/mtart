using MTArt.Catalog.Application.Products.Dtos;
using MTArt.Catalog.Application.Products.Queries.GetProducts;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Products.Queries.SearchProducts;

public sealed class SearchProductsQueryHandler(ISender sender)
    : IRequestHandler<SearchProductsQuery, Result<IReadOnlyList<ProductListItemDto>>>
{
    public async Task<Result<IReadOnlyList<ProductListItemDto>>> Handle(SearchProductsQuery request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetProductsQuery(
                request.LanguageCode, null, null, null, null, null, null, null, null, request.Term,
                ProductSortOrder.Featured, 1, request.Limit),
            cancellationToken);

        if (result.IsFailure)
        {
            return Result.Failure<IReadOnlyList<ProductListItemDto>>(result.Error);
        }

        return Result.Success<IReadOnlyList<ProductListItemDto>>(result.Value.Items);
    }
}
