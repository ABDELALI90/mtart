using FluentValidation.Results;

namespace MTArt.SharedKernel.Exceptions;

/// <summary>
/// Thrown only for requests whose response type cannot carry a Result (e.g. void commands
/// outside the Result convention). Prefer Result&lt;T&gt; failures over throwing where possible.
/// </summary>
public sealed class ValidationException : Exception
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IEnumerable<ValidationFailure> failures)
        : base("One or more validation failures occurred.")
    {
        Errors = failures
            .GroupBy(f => f.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(f => f.ErrorMessage).ToArray());
    }
}
