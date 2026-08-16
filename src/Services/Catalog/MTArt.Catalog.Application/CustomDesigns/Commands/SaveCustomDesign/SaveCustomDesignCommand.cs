using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.CustomDesigns.Dtos;
using MTArt.Catalog.Application.CustomDesigns.Mapping;
using MTArt.Catalog.Domain.CustomDesigns;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.CustomDesigns.Commands.SaveCustomDesign;

public sealed record SaveCustomDesignCommand(
    string? Name,
    decimal WidthCm,
    decimal HeightCm,
    string GeometryJson,
    string SvgMarkup,
    string? ThumbnailSvg,
    string RepeatMode,
    string? ColorSummaryJson,
    Guid? SourceMouldId) : IRequest<Result<CustomTileDesignDto>>;

public sealed class SaveCustomDesignCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<SaveCustomDesignCommand, Result<CustomTileDesignDto>>
{
    public async Task<Result<CustomTileDesignDto>> Handle(
        SaveCustomDesignCommand request,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.CustomTileDesigns
            .Select(d => d.Reference)
            .ToListAsync(cancellationToken);
        var next = existing.Select(CustomTileDesign.ParseSequence).DefaultIfEmpty(0).Max() + 1;
        var reference = CustomTileDesign.FormatReference(next);
        var name = string.IsNullOrWhiteSpace(request.Name) ? reference : request.Name.Trim();

        var design = CustomTileDesign.Create(
            reference,
            name,
            request.WidthCm,
            request.HeightCm,
            request.GeometryJson,
            request.SvgMarkup,
            request.ThumbnailSvg,
            request.RepeatMode,
            request.ColorSummaryJson,
            request.SourceMouldId);

        dbContext.CustomTileDesigns.Add(design);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success(CustomDesignMapping.ToDto(design));
    }
}
