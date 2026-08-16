using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.CustomDesigns.Dtos;
using MTArt.Catalog.Application.CustomDesigns.Mapping;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.CustomDesigns.Queries.GetCustomDesign;

public sealed record GetCustomDesignQuery(string ReferenceOrId) : IRequest<Result<CustomTileDesignDto>>;

public sealed class GetCustomDesignQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetCustomDesignQuery, Result<CustomTileDesignDto>>
{
    public async Task<Result<CustomTileDesignDto>> Handle(
        GetCustomDesignQuery request,
        CancellationToken cancellationToken)
    {
        var key = request.ReferenceOrId.Trim();
        var design = Guid.TryParse(key, out var id)
            ? await dbContext.CustomTileDesigns.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id, cancellationToken)
            : await dbContext.CustomTileDesigns.AsNoTracking()
                .FirstOrDefaultAsync(d => d.Reference == key.ToUpperInvariant(), cancellationToken);

        if (design is null)
        {
            return Result.Failure<CustomTileDesignDto>(
                Error.NotFound("custom_designs.not_found", $"Custom design '{key}' was not found."));
        }

        return Result.Success(CustomDesignMapping.ToDto(design));
    }
}
