using FluentValidation;

namespace MTArt.Catalog.Application.Products.Commands.UpdateProduct;

public sealed class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Reference).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(128);
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}
