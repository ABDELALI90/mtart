using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.CustomDesigns.Dtos;
using MTArt.Catalog.Application.CustomDesigns.Mapping;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.CustomDesigns.Commands.UpdateCustomDesign;

public sealed record UpdateCustomDesignCommand(
    Guid Id,
    string Name,
    decimal WidthCm,
    decimal HeightCm,
    string GeometryJson,
    string SvgMarkup,
    string? ThumbnailSvg,
    string RepeatMode,
    string? ColorSummaryJson) : IRequest<Result<CustomTileDesignDto>>;

public sealed class UpdateCustomDesignCommandHandler(ICatalogDbContext dbContext)
    : IRequestHandler<UpdateCustomDesignCommand, Result<CustomTileDesignDto>>
{
    public async Task<Result<CustomTileDesignDto>> Handle(
        UpdateCustomDesignCommand request,
        CancellationToken cancellationToken)
    {
        var design = await dbContext.CustomTileDesigns
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);
        if (design is null)
        {
            return Result.Failure<CustomTileDesignDto>(
                Error.NotFound("custom_designs.not_found", $"Custom design '{request.Id}' was not found."));
        }

        if (!design.IsEditable)
        {
            return Result.Failure<CustomTileDesignDto>(
                Error.Validation("custom_designs.locked", "This design can no longer be edited."));
        }

        design.UpdateContent(
            request.Name,
            request.WidthCm,
            request.HeightCm,
            request.GeometryJson,
            request.SvgMarkup,
            request.ThumbnailSvg,
            request.RepeatMode,
            request.ColorSummaryJson);

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success(CustomDesignMapping.ToDto(design));
    }
}
