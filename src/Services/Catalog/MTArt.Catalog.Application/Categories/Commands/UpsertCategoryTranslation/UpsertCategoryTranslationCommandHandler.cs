using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Categories;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Exceptions;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Categories.Commands.UpsertCategoryTranslation;

public sealed class UpsertCategoryTranslationCommandHandler(ICatalogDbContext dbContext) : IRequestHandler<UpsertCategoryTranslationCommand, Result>
{
    public async Task<Result> Handle(UpsertCategoryTranslationCommand request, CancellationToken cancellationToken)
    {
        var category = await dbContext.Categories.Include(c => c.Translations)
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken)
            ?? throw new NotFoundException(nameof(ProductCategory), request.CategoryId);

        category.UpsertTranslation(request.LanguageCode, request.Name, request.ShortDescription, request.Description, request.SeoTitle, request.SeoDescription);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
