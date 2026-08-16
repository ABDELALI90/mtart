using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Formats;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Formats.Commands.CreateFormat;

public sealed class CreateFormatCommandHandler(ICatalogDbContext dbContext) : IRequestHandler<CreateFormatCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateFormatCommand request, CancellationToken cancellationToken)
    {
        var format = Format.Create(
            request.Reference, request.WidthCm, request.HeightCm, request.ThicknessCm,
            request.UnitsPerM2, request.WeightPerUnitKg, request.WeightPerM2Kg, request.ShapeId, request.DisplayOrder);

        dbContext.Formats.Add(format);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(format.Id);
    }
}
