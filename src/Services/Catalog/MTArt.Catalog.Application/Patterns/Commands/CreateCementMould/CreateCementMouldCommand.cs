using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Patterns.Dtos;
using MTArt.Catalog.Domain.Patterns;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Patterns.Commands.CreateCementMould;

public sealed record CreateCementMouldCommand(
    string Reference,
    string Slug,
    string Name,
    Guid CategoryId,
    Guid? FormatId,
    string? PreviewImageUrl,
    string? VectorAssetUrl,
    bool IsSimulatorReady,
    int DisplayOrder,
    IReadOnlyList<CementMouldRegionInput> Regions) : IRequest<Result<Guid>>;

public sealed class CreateCementMouldCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<CreateCementMouldCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateCementMouldCommand request, CancellationToken cancellationToken)
    {
        var reference = request.Reference.Trim();
        var taken = await dbContext.TilePatterns.AnyAsync(
            p => p.Reference == reference || p.Slug.Value == request.Slug.ToLowerInvariant(),
            cancellationToken);
        if (taken)
        {
            return Result.Failure<Guid>(Error.Conflict("moulds.reference_taken", $"Mould '{reference}' already exists."));
        }

        var categoryExists = await dbContext.PatternCategories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken);
        if (!categoryExists)
        {
            return Result.Failure<Guid>(Error.NotFound("moulds.category_not_found", "Pattern category was not found."));
        }

        var mould = TilePattern.Create(reference, request.Slug, request.CategoryId, request.DisplayOrder);
        mould.UpdateAssets(request.PreviewImageUrl, request.VectorAssetUrl, request.FormatId, request.IsSimulatorReady);
        mould.UpsertTranslation("en", request.Name, null);
        mould.UpsertTranslation("fr", request.Name, null);
        mould.UpsertTranslation("es", request.Name, null);
        mould.UpsertTranslation("ar", request.Name, null);

        foreach (var region in request.Regions.OrderBy(r => r.DisplayOrder))
        {
            mould.AddRegion(region.RegionKey, region.Name, region.DefaultColorId, region.DisplayOrder);
        }

        dbContext.TilePatterns.Add(mould);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success(mould.Id);
    }
}
