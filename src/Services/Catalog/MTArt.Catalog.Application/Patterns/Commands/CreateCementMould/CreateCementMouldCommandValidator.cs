using FluentValidation;

namespace MTArt.Catalog.Application.Patterns.Commands.CreateCementMould;

public sealed class CreateCementMouldCommandValidator : AbstractValidator<CreateCementMouldCommand>
{
    public CreateCementMouldCommandValidator()
    {
        RuleFor(x => x.Reference).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(160);
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleForEach(x => x.Regions).ChildRules(region =>
        {
            region.RuleFor(r => r.RegionKey).NotEmpty().MaximumLength(64);
            region.RuleFor(r => r.Name).NotEmpty().MaximumLength(128);
        });
        RuleFor(x => x.Regions)
            .Must(r => r.Count > 0)
            .When(x => x.IsSimulatorReady)
            .WithMessage("Simulator-ready moulds must define at least one region.");
    }
}
