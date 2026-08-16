using FluentValidation;

namespace MTArt.Catalog.Application.Products.Commands.AddProductImage;

public sealed class AddProductImageCommandValidator : AbstractValidator<AddProductImageCommand>
{
    public AddProductImageCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.MediaId).NotEmpty();
        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0);
    }
}
