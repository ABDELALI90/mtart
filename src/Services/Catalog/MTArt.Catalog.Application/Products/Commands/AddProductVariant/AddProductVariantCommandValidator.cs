using FluentValidation;

namespace MTArt.Catalog.Application.Products.Commands.AddProductVariant;

public sealed class AddProductVariantCommandValidator : AbstractValidator<AddProductVariantCommand>
{
    public AddProductVariantCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.ColorId).NotEmpty();
        RuleFor(x => x.FormatId).NotEmpty();
        RuleFor(x => x.Sku).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Reference).NotEmpty().MaximumLength(64);
        RuleFor(x => x.UnitsPerM2).GreaterThan(0);
        RuleFor(x => x.WeightPerM2Kg).GreaterThan(0);
        RuleFor(x => x.ThicknessCm).GreaterThan(0);
    }
}
