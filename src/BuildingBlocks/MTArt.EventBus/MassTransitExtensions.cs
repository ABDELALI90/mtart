using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MTArt.EventBus;

public static class MassTransitExtensions
{
    /// <summary>
    /// Registers MassTransit with RabbitMQ using consistent conventions (kebab-case entity
    /// names, prefixed with <see cref="EventBusOptions.TopologyPrefix"/>) across every service.
    /// Pass <paramref name="configureConsumers"/> to register the consumers a given service owns
    /// (e.g. the Notification worker registers QuotationRequestedConsumer here); services that
    /// only publish events can omit it.
    /// </summary>
    public static IServiceCollection AddMtArtEventBus(
        this IServiceCollection services,
        IConfiguration configuration,
        Action<IBusRegistrationConfigurator>? configureConsumers = null)
    {
        var options = configuration.GetSection(EventBusOptions.SectionName).Get<EventBusOptions>() ?? new EventBusOptions();

        services.AddMassTransit(bus =>
        {
            bus.SetKebabCaseEndpointNameFormatter();

            configureConsumers?.Invoke(bus);

            bus.UsingRabbitMq((context, factory) =>
            {
                factory.Host(options.Host, options.VirtualHost, host =>
                {
                    host.Username(options.Username);
                    host.Password(options.Password);
                });

                factory.ConfigureEndpoints(context);
            });
        });

        return services;
    }
}
