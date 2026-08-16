using Microsoft.EntityFrameworkCore;
using MTArt.Catalog.Application.Common.Interfaces;
using MTArt.Catalog.Domain.Categories;
using MTArt.Catalog.Domain.ValueObjects;
using MTArt.SharedKernel.Cqrs;
using MTArt.SharedKernel.Localization;
using MTArt.SharedKernel.Results;

namespace MTArt.Catalog.Application.Categories.Commands.CreateCategory;

public sealed class CreateCategoryCommandHandler(ICatalogDbContext dbContext) : IRequestHandler<CreateCategoryCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var slug = Slug.Create(request.Slug);
        var exists = await dbContext.Categories.AnyAsync(c => c.Slug.Value == slug.Value, cancellationToken);
        if (exists)
        {
            return Result.Failure<Guid>(Error.Conflict("categories.slug_taken", $"A category with slug '{request.Slug}' already exists."));
        }

        var category = ProductCategory.Create(request.Code, request.Slug, request.DisplayOrder);
        category.UpsertTranslation(LanguageCode.Default, request.Name, null, null, null, null);

        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(category.Id);
    }
}
