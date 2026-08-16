using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.CustomDesigns.Dtos;
using MTArt.Catalog.Application.CustomDesigns.Mapping;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Pagination;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.CustomDesigns.Queries.GetCustomDesigns;

public sealed record GetCustomDesignsQuery(int PageNumber = 1, int PageSize = 24)
    : IRequest<Result<PagedResult<CustomTileDesignListItemDto>>>;

public sealed class GetCustomDesignsQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetCustomDesignsQuery, Result<PagedResult<CustomTileDesignListItemDto>>>
{
    public async Task<Result<PagedResult<CustomTileDesignListItemDto>>> Handle(
        GetCustomDesignsQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var query = dbContext.CustomTileDesigns.AsNoTracking().OrderByDescending(d => d.CreatedAt);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Result.Success(new PagedResult<CustomTileDesignListItemDto>(
            items.Select(CustomDesignMapping.ToListItem).ToList(),
            pageNumber,
            pageSize,
            total));
    }
}
