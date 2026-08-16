namespace MTArt.Catalog.Application.Patterns;

public static class MouldFamilies
{
    public const string Cement = "cement";
    public const string Zellige = "zellige";

    public static readonly string[] ZelligeCategoryCodes = ["moroccan", "stars", "rosettes", "moorish"];

    public static bool IsZelligeCategory(string? codeOrSlug) =>
        !string.IsNullOrWhiteSpace(codeOrSlug)
        && ZelligeCategoryCodes.Contains(codeOrSlug, StringComparer.OrdinalIgnoreCase);
}
