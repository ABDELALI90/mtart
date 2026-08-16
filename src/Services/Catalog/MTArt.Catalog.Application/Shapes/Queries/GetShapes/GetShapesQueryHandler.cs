using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Shapes.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Shapes.Queries.GetShapes;

public sealed class GetShapesQueryHandler(ICatalogDbContext dbContext) : IRequestHandler<GetShapesQuery, Result<IReadOnlyList<ShapeDto>>>
{
    public async Task<Result<IReadOnlyList<ShapeDto>>> Handle(GetShapesQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);

        var shapes = await dbContext.Shapes.AsNoTracking()
            .Include(s => s.Translations)
            .Where(s => s.IsActive)
            .OrderBy(s => s.DisplayOrder)
            .ToListAsync(cancellationToken);

        var dtos = shapes.Select(s =>
        {
            var translation = s.Translations.ForLanguage(language);
            return new ShapeDto(s.Id, s.Code, translation?.Name ?? s.Code, s.DisplayOrder, s.IsActive);
        }).ToList();

        return Result.Success<IReadOnlyList<ShapeDto>>(dtos);
    }
}
