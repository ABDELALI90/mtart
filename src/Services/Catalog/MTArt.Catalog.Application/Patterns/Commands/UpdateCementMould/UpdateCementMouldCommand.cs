using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Patterns.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Patterns.Commands.UpdateCementMould;

public sealed record UpdateCementMouldCommand(
    Guid Id,
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
    IReadOnlyList<CementMouldRegionInput> Regions) : IRequest<Result>;

public sealed class UpdateCementMouldCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<UpdateCementMouldCommand, Result>
{
    public async Task<Result> Handle(UpdateCementMouldCommand request, CancellationToken cancellationToken)
    {
        var mould = await dbContext.TilePatterns
            .Include(p => p.Regions)
            .Include(p => p.Translations)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (mould is null)
        {
            return Result.Failure(Error.NotFound("moulds.not_found", "Cement mould was not found."));
        }

        var clash = await dbContext.TilePatterns.AnyAsync(
            p => p.Id != request.Id && (p.Reference == request.Reference.Trim() || p.Slug.Value == request.Slug.ToLowerInvariant()),
            cancellationToken);
        if (clash)
        {
            return Result.Failure(Error.Conflict("moulds.reference_taken", $"Mould '{request.Reference}' already exists."));
        }

        mould.UpdateCore(
            request.Reference, request.Slug, request.CategoryId, request.FormatId,
            request.DisplayOrder, request.PreviewImageUrl, request.VectorAssetUrl);
        mould.SetSimulatorReady(request.IsSimulatorReady);
        mould.SetActive(request.IsActive);
        mould.UpsertTranslation("en", request.Name, null);

        mould.ClearRegions();
        foreach (var region in request.Regions.OrderBy(r => r.DisplayOrder))
        {
            mould.AddRegion(region.RegionKey, region.Name, region.DefaultColorId, region.DisplayOrder);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
