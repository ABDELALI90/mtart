using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MTArt.SharedKernel.Exceptions;

namespace MTArt.Observability.ErrorHandling;

/// <summary>
/// Converts every unhandled exception into an RFC 7807 ProblemDetails response, and never
/// leaks stack traces / SQL / internal exception details to the client in non-Development
/// environments. Expected business failures should be returned as a failed Result instead of
/// thrown; this handler is the last line of defense for genuinely unexpected errors plus the
/// handful of shared exception types (NotFoundException, ValidationException).
/// </summary>
public sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IHostEnvironment environment) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var correlationId = httpContext.Response.Headers.TryGetValue("X-Correlation-Id", out var value)
            ? value.ToString()
            : httpContext.TraceIdentifier;

        var problemDetails = MapToProblemDetails(exception, httpContext, correlationId);

        logger.LogError(exception, "Unhandled exception ({CorrelationId}): {Message}", correlationId, exception.Message);

        httpContext.Response.StatusCode = problemDetails.Status ?? StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        return true;
    }

    private ProblemDetails MapToProblemDetails(Exception exception, HttpContext httpContext, string correlationId)
    {
        var problemDetails = exception switch
        {
            NotFoundException notFound => new ProblemDetails
            {
                Title = "Resource not found",
                Detail = notFound.Message,
                Status = StatusCodes.Status404NotFound,
                Type = "https://mtart.example.com/problems/not-found",
            },
            ValidationException validation => new ValidationProblemDetails(validation.Errors)
            {
                Title = "Validation failed",
                Status = StatusCodes.Status400BadRequest,
                Type = "https://mtart.example.com/problems/validation",
            },
            _ => new ProblemDetails
            {
                Title = "An unexpected error occurred",
                Status = StatusCodes.Status500InternalServerError,
                Type = "https://mtart.example.com/problems/server-error",
                Detail = environment.IsDevelopment() ? exception.ToString() : "Please contact support with the correlation id below.",
            },
        };

        problemDetails.Instance = httpContext.Request.Path;
        problemDetails.Extensions["correlationId"] = correlationId;
        return problemDetails;
    }
}
