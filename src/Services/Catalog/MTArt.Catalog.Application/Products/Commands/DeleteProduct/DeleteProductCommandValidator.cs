using FluentValidation;

namespace MTArt.Catalog.Application.Products.Commands.DeleteProduct;

public sealed class DeleteProductCommandValidator : AbstractValidator<DeleteProductCommand>
{
    public DeleteProductCommandValidator() => RuleFor(x => x.ProductId).NotEmpty();
}
