using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using MTArt.Catalog.Application.Common.Options;
using MTArt.Catalog.Application.CustomDesigns.Assist;
using MTArt.SharedKernel.Cqrs;

namespace MTArt.Catalog.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddCatalogApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddCqrs(assembly);
        services.AddValidatorsFromAssembly(assembly);
        services.AddPipelineBehavior(typeof(ValidationBehavior<,>));
        services.AddSingleton<IDesignAssistService, UnavailableDesignAssistService>();
        services.AddSingleton(new ManufacturingOptions());

        return services;
    }
}
