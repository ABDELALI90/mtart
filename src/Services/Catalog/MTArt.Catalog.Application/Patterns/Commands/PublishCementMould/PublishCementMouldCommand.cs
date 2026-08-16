using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Patterns.Commands.PublishCementMould;

public sealed record PublishCementMouldCommand(Guid Id, bool IsSimulatorReady, bool IsActive) : IRequest<Result>;

public sealed class PublishCementMouldCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<PublishCementMouldCommand, Result>
{
    public async Task<Result> Handle(PublishCementMouldCommand request, CancellationToken cancellationToken)
    {
        var mould = await dbContext.TilePatterns
            .Include(p => p.Regions)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (mould is null)
        {
            return Result.Failure(Error.NotFound("moulds.not_found", "Cement mould was not found."));
        }

        if (request.IsSimulatorReady && (string.IsNullOrWhiteSpace(mould.VectorAssetUrl) || mould.RegionCount == 0))
        {
            return Result.Failure(Error.Validation(
                "moulds.not_ready",
                "A simulator-ready mould needs an SVG asset and at least one region."));
        }

        mould.SetSimulatorReady(request.IsSimulatorReady);
        mould.SetActive(request.IsActive);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
