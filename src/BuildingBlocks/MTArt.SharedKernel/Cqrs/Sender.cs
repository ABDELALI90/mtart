using System.Collections.Concurrent;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;

namespace MTArt.SharedKernel.Cqrs;

/// <summary>
/// Minimal, dependency-free mediator implementation. This exists so the codebase is not
/// coupled to MediatR, which requires a paid commercial license as of its v13+ releases -
/// see Directory.Packages.props for the full rationale. The public surface
/// (IRequest/IRequestHandler/IPipelineBehavior/ISender) intentionally mirrors the familiar
/// MediatR shape so the CQRS folder conventions requested for this project still apply.
/// </summary>
public sealed class Sender(IServiceProvider serviceProvider) : ISender
{
    private static readonly ConcurrentDictionary<Type, HandlerInvoker> Invokers = new();

    public Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
    {
        var invoker = Invokers.GetOrAdd(request.GetType(), CreateInvoker<TResponse>);
        return (Task<TResponse>)invoker(serviceProvider, request, cancellationToken);
    }

    public async Task Publish<TNotification>(TNotification notification, CancellationToken cancellationToken = default)
        where TNotification : INotification
    {
        var handlers = serviceProvider.GetServices<INotificationHandler<TNotification>>();
        foreach (var handler in handlers)
        {
            await handler.Handle(notification, cancellationToken);
        }
    }

    private delegate object HandlerInvoker(IServiceProvider provider, object request, CancellationToken cancellationToken);

    private static HandlerInvoker CreateInvoker<TResponse>(Type requestType)
    {
        var handlerInterface = typeof(IRequestHandler<,>).MakeGenericType(requestType, typeof(TResponse));
        var behaviorInterface = typeof(IPipelineBehavior<,>).MakeGenericType(requestType, typeof(TResponse));
        var handleMethod = handlerInterface.GetMethod(nameof(IRequestHandler<IRequest<TResponse>, TResponse>.Handle))
            ?? throw new InvalidOperationException($"Handle method not found on {handlerInterface}.");
        var behaviorHandleMethod = behaviorInterface.GetMethod(nameof(IPipelineBehavior<IRequest<TResponse>, TResponse>.Handle))
            ?? throw new InvalidOperationException($"Handle method not found on {behaviorInterface}.");

        return (provider, request, cancellationToken) =>
        {
            var handler = provider.GetService(handlerInterface)
                ?? throw new InvalidOperationException($"No handler registered for '{requestType.Name}'. " +
                    $"Expected an implementation of {handlerInterface.Name} registered in DI.");

            var behaviors = provider.GetServices(behaviorInterface).Reverse().ToArray();

            RequestHandlerDelegate<TResponse> terminal = () =>
                (Task<TResponse>)handleMethod.Invoke(handler, [request, cancellationToken])!;

            var pipeline = behaviors.Aggregate(terminal, (next, behavior) =>
                () => (Task<TResponse>)behaviorHandleMethod.Invoke(behavior, [request, next, cancellationToken])!);

            return pipeline();
        };
    }
}

public static class SenderServiceCollectionExtensions
{
    /// <summary>
    /// Registers <see cref="Sender"/> plus every <see cref="IRequestHandler{TRequest,TResponse}"/>
    /// and <see cref="INotificationHandler{TNotification}"/> found in the given assemblies.
    /// </summary>
    public static IServiceCollection AddCqrs(this IServiceCollection services, params Assembly[] assemblies)
    {
        services.AddScoped<ISender, Sender>();

        foreach (var assembly in assemblies)
        {
            RegisterImplementations(services, assembly, typeof(IRequestHandler<,>));
            RegisterImplementations(services, assembly, typeof(INotificationHandler<>));
        }

        return services;
    }

    /// <summary>
    /// Registers a pipeline behavior for every request in the given assemblies that implements
    /// <paramref name="openBehaviorType"/> (an open generic, e.g. typeof(ValidationBehavior&lt;,&gt;)).
    /// Behaviors run in the order they are added.
    /// </summary>
    public static IServiceCollection AddPipelineBehavior(this IServiceCollection services, Type openBehaviorType)
    {
        services.AddTransient(typeof(IPipelineBehavior<,>), openBehaviorType);
        return services;
    }

    private static void RegisterImplementations(IServiceCollection services, Assembly assembly, Type openInterfaceType)
    {
        var implementations = assembly.GetTypes()
            .Where(type => type is { IsAbstract: false, IsInterface: false })
            .SelectMany(type => type.GetInterfaces()
                .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == openInterfaceType)
                .Select(i => new { Service = i, Implementation = type }));

        foreach (var implementation in implementations)
        {
            services.AddTransient(implementation.Service, implementation.Implementation);
        }
    }
}
