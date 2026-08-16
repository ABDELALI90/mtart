using FluentValidation;

namespace MTArt.Catalog.Application.Products.Commands.UnpublishProduct;

public sealed class UnpublishProductCommandValidator : AbstractValidator<UnpublishProductCommand>
{
    public UnpublishProductCommandValidator() => RuleFor(x => x.ProductId).NotEmpty();
}
