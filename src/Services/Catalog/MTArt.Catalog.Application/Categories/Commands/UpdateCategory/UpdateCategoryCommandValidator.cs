using FluentValidation;

namespace MTArt.Catalog.Application.Categories.Commands.UpdateCategory;

public sealed class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator()
    {
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.Code).NotEmpty().MaximumLength(32);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(128);
    }
}
