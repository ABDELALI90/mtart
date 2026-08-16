using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Collections;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Exceptions;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Collections.Commands.UpsertCollectionTranslation;

public sealed class UpsertCollectionTranslationCommandHandler(ICatalogDbContext dbContext) : IRequestHandler<UpsertCollectionTranslationCommand, Result>
{
    public async Task<Result> Handle(UpsertCollectionTranslationCommand request, CancellationToken cancellationToken)
    {
        var collection = await dbContext.Collections.Include(c => c.Translations)
            .FirstOrDefaultAsync(c => c.Id == request.CollectionId, cancellationToken)
            ?? throw new NotFoundException(nameof(Collection), request.CollectionId);

        collection.UpsertTranslation(request.LanguageCode, request.Name, request.Story, request.Description, request.SeoTitle, request.SeoDescription);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
