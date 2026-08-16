using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;

namespace MTArt.Observability.Logging;

public static class SerilogSetup
{
    /// <summary>
    /// Configures Serilog as the host's logging provider with structured console output
    /// (JSON in production so log shippers can parse it) plus an optional Seq sink.
    /// Never logs full request bodies - form/inquiry payloads may contain personal data.
    /// </summary>
    public static WebApplicationBuilder AddMtArtLogging(this WebApplicationBuilder builder, string serviceName)
    {
        builder.Host.UseSerilog((context, services, configuration) =>
        {
            configuration
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
                .Enrich.FromLogContext()
                .Enrich.WithCorrelationId()
                .Enrich.WithProperty("Service", serviceName)
                .Enrich.WithProperty("Environment", context.HostingEnvironment.EnvironmentName)
                .ReadFrom.Configuration(context.Configuration);

            if (context.HostingEnvironment.IsDevelopment())
            {
                configuration.WriteTo.Console(
                    outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] ({CorrelationId}) {Message:lj}{NewLine}{Exception}");
            }
            else
            {
                configuration.WriteTo.Console(new CompactJsonFormatter());
            }

            var seqUrl = context.Configuration["Observability:SeqUrl"];
            if (!string.IsNullOrWhiteSpace(seqUrl))
            {
                configuration.WriteTo.Seq(seqUrl);
            }
        });

        return builder;
    }
}
