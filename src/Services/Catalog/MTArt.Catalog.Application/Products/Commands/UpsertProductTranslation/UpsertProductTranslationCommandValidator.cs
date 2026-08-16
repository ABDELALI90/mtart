using FluentValidation;
using MTArt.SharedKernel.Localization;

namespace MTArt.Catalog.Application.Products.Commands.UpsertProductTranslation;

public sealed class UpsertProductTranslationCommandValidator : AbstractValidator<UpsertProductTranslationCommand>
{
    public UpsertProductTranslationCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.LanguageCode).Must(LanguageCode.IsSupported)
            .WithMessage($"Language code must be one of: {string.Join(", ", LanguageCode.All)}.");
        RuleFor(x => x.Name).NotEmpty().MaximumLength(256);
        RuleFor(x => x.SeoTitle).MaximumLength(70);
        RuleFor(x => x.SeoDescription).MaximumLength(160);
    }
}
