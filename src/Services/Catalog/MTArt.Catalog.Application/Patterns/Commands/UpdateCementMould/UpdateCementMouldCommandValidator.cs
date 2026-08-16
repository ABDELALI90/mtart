using FluentValidation;

namespace MTArt.Catalog.Application.Patterns.Commands.UpdateCementMould;

public sealed class UpdateCementMouldCommandValidator : AbstractValidator<UpdateCementMouldCommand>
{
    public UpdateCementMouldCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Reference).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(160);
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleForEach(x => x.Regions).ChildRules(region =>
        {
            region.RuleFor(r => r.RegionKey).NotEmpty().MaximumLength(64);
            region.RuleFor(r => r.Name).NotEmpty().MaximumLength(128);
        });
    }
}
