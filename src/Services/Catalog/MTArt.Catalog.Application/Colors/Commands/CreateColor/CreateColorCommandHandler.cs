using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Colors;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Colors.Commands.CreateColor;

public sealed class CreateColorCommandHandler(ICatalogDbContext dbContext) : IRequestHandler<CreateColorCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateColorCommand request, CancellationToken cancellationToken)
    {
        var exists = await dbContext.Colors.AnyAsync(c => c.Code == request.Code, cancellationToken);
        if (exists)
        {
            return Result.Failure<Guid>(Error.Conflict("colors.code_taken", $"A color with code '{request.Code}' already exists."));
        }

        var color = Color.Create(request.Code, request.Family, request.DisplayOrder);
        color.UpdateCore(request.Code, request.Family, request.HexApproximation, null, request.DisplayOrder);
        color.UpsertTranslation(LanguageCode.Default, request.Name, null);

        dbContext.Colors.Add(color);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(color.Id);
    }
}
