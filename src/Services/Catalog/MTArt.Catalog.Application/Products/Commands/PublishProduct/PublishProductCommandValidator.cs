using FluentValidation;

namespace MTArt.Catalog.Application.Products.Commands.PublishProduct;

public sealed class PublishProductCommandValidator : AbstractValidator<PublishProductCommand>
{
    public PublishProductCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
    }
}
