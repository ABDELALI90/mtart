using FluentValidation;
using MTArt.SharedKernel.Localization;

namespace MTArt.Catalog.Application.Collections.Commands.UpsertCollectionTranslation;

public sealed class UpsertCollectionTranslationCommandValidator : AbstractValidator<UpsertCollectionTranslationCommand>
{
    public UpsertCollectionTranslationCommandValidator()
    {
        RuleFor(x => x.CollectionId).NotEmpty();
        RuleFor(x => x.LanguageCode).Must(LanguageCode.IsSupported);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(128);
    }
}
