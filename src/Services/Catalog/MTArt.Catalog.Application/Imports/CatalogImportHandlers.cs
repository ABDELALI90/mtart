using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain;
using MTArt.Catalog.Domain.Imports;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Imports;

public sealed record CatalogImportStatusDto(
    Guid? SessionId, string SourceCatalog, string Status, int PageCount,
    int ProductsDetected, int ProjectsDetected, int UnknownPages, int Imported, int NeedsReview);

public sealed record CatalogImportPageDto(
    Guid Id, int Page, string ImportId, string Classification, string? SuggestedName, string? SuggestedReference,
    string? SuggestedCategory, string? DetectedShape, decimal? ExtractedPrice, string? PriceUnit,
    string? ImageUrl, bool NeedsReview, Guid? ImportedProductId, double ImportConfidence);

public sealed record GetCatalogImportStatusQuery() : IRequest<Result<CatalogImportStatusDto>>;

public sealed class GetCatalogImportStatusQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetCatalogImportStatusQuery, Result<CatalogImportStatusDto>>
{
    public async Task<Result<CatalogImportStatusDto>> Handle(GetCatalogImportStatusQuery request, CancellationToken cancellationToken)
    {
        var session = await dbContext.CatalogImportSessions.AsNoTracking()
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (session is null)
        {
            return Result.Success(new CatalogImportStatusDto(null, string.Empty, "None", 0, 0, 0, 0, 0, 0));
        }

        return Result.Success(new CatalogImportStatusDto(
            session.Id, session.SourceCatalog, session.Status.ToString(), session.PageCount,
            session.ProductsDetected, session.ProjectsDetected, session.UnknownPages,
            session.ImportedCount, session.NeedsReviewCount));
    }
}

public sealed record GetCatalogImportPreviewQuery(Guid? SessionId = null) : IRequest<Result<IReadOnlyList<CatalogImportPageDto>>>;

public sealed class GetCatalogImportPreviewQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetCatalogImportPreviewQuery, Result<IReadOnlyList<CatalogImportPageDto>>>
{
    public async Task<Result<IReadOnlyList<CatalogImportPageDto>>> Handle(GetCatalogImportPreviewQuery request, CancellationToken cancellationToken)
    {
        var session = request.SessionId.HasValue
            ? await dbContext.CatalogImportSessions.Include(s => s.Pages).FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken)
            : await dbContext.CatalogImportSessions.Include(s => s.Pages).OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync(cancellationToken);

        if (session is null)
        {
            return Result.Success<IReadOnlyList<CatalogImportPageDto>>([]);
        }

        var dtos = session.Pages.OrderBy(p => p.PageNumber).Select(p => new CatalogImportPageDto(
            p.Id, p.PageNumber, p.ImportId, p.Classification.ToString(), p.SuggestedName, p.SuggestedReference,
            p.SuggestedCategory, p.DetectedShape, p.ExtractedPrice, p.PriceUnit, p.ImageUrl, p.NeedsReview,
            p.ImportedProductId, p.ImportConfidence)).ToList();

        return Result.Success<IReadOnlyList<CatalogImportPageDto>>(dtos);
    }
}

public sealed record GetCatalogImportErrorsQuery(Guid? SessionId = null) : IRequest<Result<IReadOnlyList<CatalogImportPageDto>>>;

public sealed class GetCatalogImportErrorsQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetCatalogImportErrorsQuery, Result<IReadOnlyList<CatalogImportPageDto>>>
{
    public async Task<Result<IReadOnlyList<CatalogImportPageDto>>> Handle(GetCatalogImportErrorsQuery request, CancellationToken cancellationToken)
    {
        var preview = await new GetCatalogImportPreviewQueryHandler(dbContext).Handle(new GetCatalogImportPreviewQuery(request.SessionId), cancellationToken);
        if (preview.IsFailure)
        {
            return Result.Failure<IReadOnlyList<CatalogImportPageDto>>(preview.Error);
        }

        return Result.Success<IReadOnlyList<CatalogImportPageDto>>(preview.Value.Where(p => p.NeedsReview || p.Classification is "Unknown" or "Marketing").ToList());
    }
}

public sealed record AnalyzeCatalogCommand() : IRequest<Result<CatalogImportStatusDto>>;

public sealed class AnalyzeCatalogCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<AnalyzeCatalogCommand, Result<CatalogImportStatusDto>>
{
    public async Task<Result<CatalogImportStatusDto>> Handle(AnalyzeCatalogCommand request, CancellationToken cancellationToken)
    {
        var existing = await dbContext.CatalogImportSessions.AsNoTracking()
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing is not null)
        {
            return Result.Success(new CatalogImportStatusDto(
                existing.Id, existing.SourceCatalog, existing.Status.ToString(), existing.PageCount,
                existing.ProductsDetected, existing.ProjectsDetected, existing.UnknownPages,
                existing.ImportedCount, existing.NeedsReviewCount));
        }

        return Result.Failure<CatalogImportStatusDto>(Error.NotFound(
            "imports.not_analyzed",
            "No catalog analysis is available. Restart Catalog API in Development to import catalog_with_price.pdf."));
    }
}

public sealed record ConfirmCatalogImportCommand(Guid? SessionId = null) : IRequest<Result<CatalogImportStatusDto>>;

public sealed class ConfirmCatalogImportCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<ConfirmCatalogImportCommand, Result<CatalogImportStatusDto>>
{
    public async Task<Result<CatalogImportStatusDto>> Handle(ConfirmCatalogImportCommand request, CancellationToken cancellationToken)
    {
        var session = request.SessionId.HasValue
            ? await dbContext.CatalogImportSessions.Include(s => s.Pages).FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken)
            : await dbContext.CatalogImportSessions.Include(s => s.Pages).OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync(cancellationToken);

        if (session is null)
        {
            return Result.Failure<CatalogImportStatusDto>(Error.NotFound("imports.not_found", "No catalog import session was found."));
        }

        session.Recalculate();
        session.Confirm(session.Pages.Count(p => p.ImportedProductId.HasValue));
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new CatalogImportStatusDto(
            session.Id, session.SourceCatalog, session.Status.ToString(), session.PageCount,
            session.ProductsDetected, session.ProjectsDetected, session.UnknownPages,
            session.ImportedCount, session.NeedsReviewCount));
    }
}

public sealed record CancelCatalogImportCommand(Guid? SessionId = null) : IRequest<Result<CatalogImportStatusDto>>;

public sealed class CancelCatalogImportCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<CancelCatalogImportCommand, Result<CatalogImportStatusDto>>
{
    public async Task<Result<CatalogImportStatusDto>> Handle(CancelCatalogImportCommand request, CancellationToken cancellationToken)
    {
        var session = request.SessionId.HasValue
            ? await dbContext.CatalogImportSessions.FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken)
            : await dbContext.CatalogImportSessions.OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync(cancellationToken);

        if (session is null)
        {
            return Result.Failure<CatalogImportStatusDto>(Error.NotFound("imports.not_found", "No catalog import session was found."));
        }

        session.Cancel();
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success(new CatalogImportStatusDto(
            session.Id, session.SourceCatalog, session.Status.ToString(), session.PageCount,
            session.ProductsDetected, session.ProjectsDetected, session.UnknownPages,
            session.ImportedCount, session.NeedsReviewCount));
    }
}

public sealed record UpdateCatalogImportPageCommand(
    Guid PageId,
    string Classification,
    string? SuggestedName,
    string? SuggestedReference,
    string? SuggestedCategory,
    string? DetectedShape,
    decimal? ExtractedPrice,
    bool NeedsReview) : IRequest<Result>;

public sealed class UpdateCatalogImportPageCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<UpdateCatalogImportPageCommand, Result>
{
    public async Task<Result> Handle(UpdateCatalogImportPageCommand request, CancellationToken cancellationToken)
    {
        var session = await dbContext.CatalogImportSessions.Include(s => s.Pages)
            .FirstOrDefaultAsync(s => s.Pages.Any(p => p.Id == request.PageId), cancellationToken);
        var page = session?.Pages.FirstOrDefault(p => p.Id == request.PageId);
        if (session is null || page is null)
        {
            return Result.Failure(Error.NotFound("imports.page_not_found", "Import page was not found."));
        }

        if (!Enum.TryParse<CatalogPageKind>(request.Classification, true, out var kind))
        {
            kind = CatalogPageKind.Unknown;
        }

        page.Correct(kind, request.SuggestedName, request.SuggestedReference, request.SuggestedCategory, request.DetectedShape, request.ExtractedPrice, request.NeedsReview);
        session.Recalculate();
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public sealed record AssetInventoryDto(
    int ZelligeImages,
    int BjmatImages,
    int CementTileImages,
    int ZelligeColorSamples,
    int CementColors,
    int BjmatColorSamples,
    int CatalogReferences,
    int MouldCandidates,
    int SimulatorReady,
    int NeedsReview);

public sealed record GetAssetInventoryQuery() : IRequest<Result<AssetInventoryDto>>;

public sealed class GetAssetInventoryQueryHandler(ICatalogDbContext dbContext)
    : IRequestHandler<GetAssetInventoryQuery, Result<AssetInventoryDto>>
{
    public async Task<Result<AssetInventoryDto>> Handle(GetAssetInventoryQuery request, CancellationToken cancellationToken)
    {
        var categories = await dbContext.Categories.AsNoTracking()
            .ToDictionaryAsync(c => c.Code, c => c.Id, cancellationToken);

        categories.TryGetValue("ZELLIGE", out var zelligeId);
        categories.TryGetValue("BEJMAT", out var bjmatId);
        categories.TryGetValue("CEMENT", out var cementId);

        var zelligeImages = zelligeId == Guid.Empty ? 0 : await dbContext.Products.AsNoTracking().CountAsync(p => !p.IsDemo && p.CategoryId == zelligeId, cancellationToken);
        var bjmatImages = bjmatId == Guid.Empty ? 0 : await dbContext.Products.AsNoTracking().CountAsync(p => !p.IsDemo && p.CategoryId == bjmatId, cancellationToken);
        var cementImages = cementId == Guid.Empty ? 0 : await dbContext.Products.AsNoTracking().CountAsync(p => !p.IsDemo && p.CategoryId == cementId, cancellationToken);

        var zelligeColors = await dbContext.Colors.AsNoTracking().CountAsync(c => !c.IsDemo && c.MaterialType == MaterialType.Zellige, cancellationToken);
        var cementColors = await dbContext.Colors.AsNoTracking().CountAsync(c => !c.IsDemo && c.MaterialType == MaterialType.CementTile, cancellationToken);
        var bjmatColors = await dbContext.Colors.AsNoTracking().CountAsync(c => !c.IsDemo && c.MaterialType == MaterialType.Bejmat, cancellationToken);
        var catalogRefs = await dbContext.Products.AsNoTracking().CountAsync(p => !p.IsDemo, cancellationToken);
        var moulds = await dbContext.TilePatterns.AsNoTracking().CountAsync(cancellationToken);
        var ready = await dbContext.TilePatterns.AsNoTracking().CountAsync(p => p.IsSimulatorReady, cancellationToken);
        var needsReview = await dbContext.CatalogImportSessions.AsNoTracking()
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => s.NeedsReviewCount)
            .FirstOrDefaultAsync(cancellationToken) + bjmatImages;

        return Result.Success(new AssetInventoryDto(
            zelligeImages, bjmatImages, cementImages,
            zelligeColors, cementColors, bjmatColors,
            catalogRefs, moulds, ready, needsReview));
    }
}
