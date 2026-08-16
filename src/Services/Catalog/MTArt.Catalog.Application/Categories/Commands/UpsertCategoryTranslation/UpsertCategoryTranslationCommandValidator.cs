using FluentValidation;
using MTArt.SharedKernel.Localization;

namespace MTArt.Catalog.Application.Categories.Commands.UpsertCategoryTranslation;

public sealed class UpsertCategoryTranslationCommandValidator : AbstractValidator<UpsertCategoryTranslationCommand>
{
    public UpsertCategoryTranslationCommandValidator()
    {
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.LanguageCode).Must(LanguageCode.IsSupported);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(128);
    }
}
