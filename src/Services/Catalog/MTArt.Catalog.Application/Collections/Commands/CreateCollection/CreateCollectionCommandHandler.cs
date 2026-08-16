using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Collections;
using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Collections.Commands.CreateCollection;

public sealed class CreateCollectionCommandHandler(ICatalogDbContext dbContext) : IRequestHandler<CreateCollectionCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateCollectionCommand request, CancellationToken cancellationToken)
    {
        var slug = Slug.Create(request.Slug);
        var exists = await dbContext.Collections.AnyAsync(c => c.Slug.Value == slug.Value, cancellationToken);
        if (exists)
        {
            return Result.Failure<Guid>(Error.Conflict("collections.slug_taken", $"A collection with slug '{request.Slug}' already exists."));
        }

        var collection = Collection.Create(request.Slug, request.DisplayOrder);
        collection.UpsertTranslation(LanguageCode.Default, request.Name, null, null, null, null);

        dbContext.Collections.Add(collection);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(collection.Id);
    }
}
