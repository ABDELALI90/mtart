using FluentValidation;

namespace MTArt.Catalog.Application.CustomDesigns.Commands.UpdateCustomDesign;

public sealed class UpdateCustomDesignCommandValidator : AbstractValidator<UpdateCustomDesignCommand>
{
    public UpdateCustomDesignCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(160);
        RuleFor(x => x.WidthCm).InclusiveBetween(5, 60);
        RuleFor(x => x.HeightCm).InclusiveBetween(5, 60);
        RuleFor(x => x.GeometryJson).NotEmpty();
        RuleFor(x => x.SvgMarkup).NotEmpty();
        RuleFor(x => x.RepeatMode).NotEmpty().MaximumLength(32);
    }
}
