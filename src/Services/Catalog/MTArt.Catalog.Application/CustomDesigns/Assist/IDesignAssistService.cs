/// <summary>
/// Future hook for “describe your design” generation. The interactive editor must never depend on this.
/// A later service can implement prompt → parametric geometry; until then the React client uses local
/// motif generators in features/designer/assist.
/// </summary>
namespace MTArt.Catalog.Application.CustomDesigns.Assist;

public sealed record DesignAssistRequest(string Prompt);

public sealed record DesignAssistResult(string GeometryJson, string Notes);

public interface IDesignAssistService
{
    Task<DesignAssistResult?> TryGenerateAsync(DesignAssistRequest request, CancellationToken cancellationToken);
}

/// <summary>Placeholder so the designer works fully without an AI provider.</summary>
public sealed class UnavailableDesignAssistService : IDesignAssistService
{
    public Task<DesignAssistResult?> TryGenerateAsync(DesignAssistRequest request, CancellationToken cancellationToken) =>
        Task.FromResult<DesignAssistResult?>(null);
}
