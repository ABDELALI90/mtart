using FluentValidation;

namespace MTArt.Catalog.Application.Collections.Commands.CreateCollection;

public sealed class CreateCollectionCommandValidator : AbstractValidator<CreateCollectionCommand>
{
    public CreateCollectionCommandValidator()
    {
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(128);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(128);
    }
}
