using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Patterns.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Patterns.Queries.GetCementMouldRegions;

public sealed record GetCementMouldRegionsQuery(string ReferenceOrSlug)
    : IRequest<Result<IReadOnlyList<PatternRegionDto>>>;

public sealed class GetCementMouldRegionsQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetCementMouldRegionsQuery, Result<IReadOnlyList<PatternRegionDto>>>
{
    public async Task<Result<IReadOnlyList<PatternRegionDto>>> Handle(
        GetCementMouldRegionsQuery request, CancellationToken cancellationToken)
    {
        var key = request.ReferenceOrSlug.Trim();
        var slug = key.ToLowerInvariant();

        var pattern = await dbContext.TilePatterns.AsNoTracking()
            .Include(p => p.Regions)
            .FirstOrDefaultAsync(
                p => p.Slug.Value == slug || p.Reference == key || p.Reference == slug,
                cancellationToken);

        if (pattern is null)
        {
            return Result.Failure<IReadOnlyList<PatternRegionDto>>(
                Error.NotFound("moulds.not_found", $"Cement mould '{request.ReferenceOrSlug}' was not found."));
        }

        var colorIds = pattern.Regions.Where(r => r.DefaultColorId.HasValue).Select(r => r.DefaultColorId!.Value).Distinct().ToList();
        var colors = colorIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await dbContext.Colors.AsNoTracking()
                .Where(c => colorIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => c.Code, cancellationToken);

        var regions = pattern.Regions.OrderBy(r => r.DisplayOrder)
            .Select(r =>
            {
                colors.TryGetValue(r.DefaultColorId ?? Guid.Empty, out var code);
                return new PatternRegionDto(r.Id, r.RegionKey, r.DisplayName, r.DefaultColorId, code, r.DisplayOrder);
            })
            .ToList();

        return Result.Success<IReadOnlyList<PatternRegionDto>>(regions);
    }
}
