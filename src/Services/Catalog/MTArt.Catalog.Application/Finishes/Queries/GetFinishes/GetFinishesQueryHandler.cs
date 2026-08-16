using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Application.Finishes.Dtos;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Finishes.Queries.GetFinishes;

public sealed class GetFinishesQueryHandler(ICatalogDbContext dbContext) : IRequestHandler<GetFinishesQuery, Result<IReadOnlyList<FinishDto>>>
{
    public async Task<Result<IReadOnlyList<FinishDto>>> Handle(GetFinishesQuery request, CancellationToken cancellationToken)
    {
        var language = LanguageCode.Normalize(request.LanguageCode);

        var finishes = await dbContext.Finishes.AsNoTracking()
            .Include(f => f.Translations)
            .Where(f => f.IsActive)
            .OrderBy(f => f.DisplayOrder)
            .ToListAsync(cancellationToken);

        var dtos = finishes.Select(f =>
        {
            var translation = f.Translations.ForLanguage(language);
            return new FinishDto(f.Id, f.Code, translation?.Name ?? f.Code, f.DisplayOrder, f.IsActive);
        }).ToList();

        return Result.Success<IReadOnlyList<FinishDto>>(dtos);
    }
}
