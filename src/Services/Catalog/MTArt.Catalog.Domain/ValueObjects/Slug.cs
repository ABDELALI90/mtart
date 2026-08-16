using System.Text.RegularExpressions;
using MTArt.SharedKernel.Domain;

namespace MTArt.Catalog.Domain.ValueObjects;

/// <summary>
/// A URL-safe identifier (lowercase letters, digits, single hyphens). Stable slugs are part
/// of the public contract - once published, a product/category/collection slug should not
/// silently change, since it would break the localized route (/en/products/{slug}) and SEO.
/// </summary>
public sealed partial class Slug : ValueObject
{
    // Private setter + parameterless constructor (rather than constructor-binding) is the
    // safest materialization pattern for EF Core complex/owned types - see
    // MTArt.Catalog.Infrastructure Persistence/Configurations for the mapping.
    public string Value { get; private set; } = string.Empty;

    private Slug()
    {
    }

    private Slug(string value) => Value = value;

    public static Slug Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Slug cannot be empty.", nameof(value));
        }

        var normalized = value.Trim().ToLowerInvariant();

        if (!SlugRegex().IsMatch(normalized))
        {
            throw new ArgumentException(
                $"'{value}' is not a valid slug. Use lowercase letters, digits and single hyphens only.",
                nameof(value));
        }

        return new Slug(normalized);
    }

    public static bool TryCreate(string? value, out Slug? slug)
    {
        slug = null;
        if (string.IsNullOrWhiteSpace(value) || !SlugRegex().IsMatch(value.Trim().ToLowerInvariant()))
        {
            return false;
        }

        slug = new Slug(value.Trim().ToLowerInvariant());
        return true;
    }

    public static Slug FromTrusted(string value) => new(value);

    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*$")]
    private static partial Regex SlugRegex();

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;

    public static implicit operator string(Slug slug) => slug.Value;
}
