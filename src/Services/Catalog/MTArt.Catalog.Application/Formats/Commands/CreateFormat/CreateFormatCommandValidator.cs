using FluentValidation;

namespace MTArt.Catalog.Application.Formats.Commands.CreateFormat;

public sealed class CreateFormatCommandValidator : AbstractValidator<CreateFormatCommand>
{
    public CreateFormatCommandValidator()
    {
        RuleFor(x => x.Reference).NotEmpty().MaximumLength(32);
        RuleFor(x => x.WidthCm).GreaterThan(0);
        RuleFor(x => x.HeightCm).GreaterThan(0);
        RuleFor(x => x.ThicknessCm).GreaterThan(0);
        RuleFor(x => x.UnitsPerM2).GreaterThan(0);
        RuleFor(x => x.WeightPerUnitKg).GreaterThan(0);
        RuleFor(x => x.WeightPerM2Kg).GreaterThan(0);
        RuleFor(x => x.ShapeId).NotEmpty();
    }
}
