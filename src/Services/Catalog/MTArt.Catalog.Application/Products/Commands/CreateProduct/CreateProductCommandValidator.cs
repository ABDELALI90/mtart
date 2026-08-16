using FluentValidation;

namespace MTArt.Catalog.Application.Products.Commands.CreateProduct;

public sealed class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Reference).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(128);
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.MinimumOrderM2).GreaterThan(0).When(x => x.MinimumOrderM2.HasValue);
        RuleFor(x => x.UnitsPerSquareMeter).GreaterThan(0).When(x => x.UnitsPerSquareMeter.HasValue);
        RuleFor(x => x.WeightPerSquareMeterKg).GreaterThan(0).When(x => x.WeightPerSquareMeterKg.HasValue);
        RuleFor(x => x.ThicknessCm).GreaterThan(0).When(x => x.ThicknessCm.HasValue);
    }
}
