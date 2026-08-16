using FluentValidation;
using MTArt.SharedKernel.Results;

namespace MTArt.SharedKernel.Cqrs;

/// <summary>
/// Runs every registered FluentValidation validator for a request before it reaches its
/// handler. Requires TResponse to be (or derive from) Result so validation failures can be
/// surfaced as a normal failed Result instead of throwing - keeping the API's error handling
/// uniform. See ApplicationServiceCollectionExtensions.AddApplicationCqrs for registration.
/// </summary>
public sealed class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!validators.Any())
        {
            return await next();
        }

        var failures = (await Task.WhenAll(validators.Select(v => v.ValidateAsync(request, cancellationToken))))
            .SelectMany(result => result.Errors)
            .Where(failure => failure is not null)
            .ToList();

        if (failures.Count == 0)
        {
            return await next();
        }

        var message = string.Join(" | ", failures.Select(f => $"{f.PropertyName}: {f.ErrorMessage}"));
        var error = Error.Validation("validation.failed", message);

        if (typeof(TResponse) == typeof(Unit))
        {
            throw new SharedKernel.Exceptions.ValidationException(failures);
        }

        // TResponse is expected to be Result or Result<T> (enforced by convention/architecture tests).
        var resultType = typeof(TResponse);
        if (resultType == typeof(Result))
        {
            return (TResponse)(object)Result.Failure(error);
        }

        if (resultType.IsGenericType && resultType.GetGenericTypeDefinition() == typeof(Result<>))
        {
            var failureMethod = typeof(Result).GetMethod(nameof(Result.Failure), 1, [typeof(Error)])!
                .MakeGenericMethod(resultType.GetGenericArguments());
            return (TResponse)failureMethod.Invoke(null, [error])!;
        }

        throw new SharedKernel.Exceptions.ValidationException(failures);
    }
}
