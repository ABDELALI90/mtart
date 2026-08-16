using FluentValidation;

namespace MTArt.Catalog.Application.CustomDesigns.Commands.SaveCustomDesign;

public sealed class SaveCustomDesignCommandValidator : AbstractValidator<SaveCustomDesignCommand>
{
    public SaveCustomDesignCommandValidator()
    {
        RuleFor(x => x.Name).MaximumLength(160);
        RuleFor(x => x.WidthCm).InclusiveBetween(5, 60);
        RuleFor(x => x.HeightCm).InclusiveBetween(5, 60);
        RuleFor(x => x.GeometryJson).NotEmpty();
        RuleFor(x => x.SvgMarkup).NotEmpty();
        RuleFor(x => x.RepeatMode).NotEmpty().MaximumLength(32);
    }
}
