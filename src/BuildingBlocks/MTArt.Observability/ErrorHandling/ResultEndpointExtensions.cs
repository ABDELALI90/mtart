using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MTArt.SharedKernel.Results;

namespace MTArt.Observability.ErrorHandling;

/// <summary>Maps a failed application-layer Result to the correct HTTP status + ProblemDetails.</summary>
public static class ResultEndpointExtensions
{
    public static IActionResult ToProblem(this Result result, HttpContext httpContext)
    {
        if (result.IsSuccess)
        {
            throw new InvalidOperationException("Cannot convert a successful result to a problem response.");
        }

        var statusCode = result.Error.Type switch
        {
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status500InternalServerError,
        };

        var problemDetails = new ProblemDetails
        {
            Title = result.Error.Code,
            Detail = result.Error.Message,
            Status = statusCode,
            Instance = httpContext.Request.Path,
            Type = $"https://mtart.example.com/problems/{result.Error.Type.ToString().ToLowerInvariant()}",
        };

        return new ObjectResult(problemDetails) { StatusCode = statusCode };
    }

    /// <summary>Minimal-API friendly equivalent of <see cref="ToProblem"/> (returns <see cref="IResult"/> rather than <see cref="IActionResult"/>).</summary>
    public static IResult ToProblemResult(this Result result, HttpContext httpContext)
    {
        if (result.IsSuccess)
        {
            throw new InvalidOperationException("Cannot convert a successful result to a problem response.");
        }

        var statusCode = result.Error.Type switch
        {
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status500InternalServerError,
        };

        return Results.Problem(
            title: result.Error.Code,
            detail: result.Error.Message,
            statusCode: statusCode,
            instance: httpContext.Request.Path,
            type: $"https://mtart.example.com/problems/{result.Error.Type.ToString().ToLowerInvariant()}");
    }
}
