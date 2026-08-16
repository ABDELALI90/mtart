using MTArt.Catalog.Application.Common.Options;
using MTArt.Catalog.Application.CustomDesigns.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.CustomDesigns.Queries.GetManufacturingSettings;

public sealed record GetManufacturingSettingsQuery : IRequest<Result<ManufacturingSettingsDto>>;

public sealed class GetManufacturingSettingsQueryHandler(ManufacturingOptions options)
    : IRequestHandler<GetManufacturingSettingsQuery, Result<ManufacturingSettingsDto>>
{
    public Task<Result<ManufacturingSettingsDto>> Handle(
        GetManufacturingSettingsQuery request,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(Result.Success(new ManufacturingSettingsDto(
            options.MinRegionAreaMm2,
            options.MinRegionWidthMm,
            options.MaxOverlapRatio,
            options.MinGapMm)));
    }
}
