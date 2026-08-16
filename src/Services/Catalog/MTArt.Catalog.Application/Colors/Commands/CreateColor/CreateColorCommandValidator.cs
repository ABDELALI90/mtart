using FluentValidation;

namespace MTArt.Catalog.Application.Colors.Commands.CreateColor;

public sealed class CreateColorCommandValidator : AbstractValidator<CreateColorCommand>
{
    public CreateColorCommandValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(32);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(128);
        RuleFor(x => x.HexApproximation).Matches("^#?[0-9A-Fa-f]{6}$").When(x => !string.IsNullOrWhiteSpace(x.HexApproximation));
    }
}
