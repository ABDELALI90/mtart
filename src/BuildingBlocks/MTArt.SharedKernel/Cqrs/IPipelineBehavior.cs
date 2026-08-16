namespace MTArt.SharedKernel.Cqrs;

public delegate Task<TResponse> RequestHandlerDelegate<TResponse>();

/// <summary>
/// Cross-cutting middleware around request handling (validation, logging, transactions, ...).
/// Behaviors registered in DI run in registration order, each wrapping the next.
/// </summary>
public interface IPipelineBehavior<in TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken);
}
