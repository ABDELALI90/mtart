using FluentValidation;

namespace MTArt.Catalog.Application.Products.Commands.RemoveProductVariant;

public sealed class RemoveProductVariantCommandValidator : AbstractValidator<RemoveProductVariantCommand>
{
    public RemoveProductVariantCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.VariantId).NotEmpty();
    }
}
