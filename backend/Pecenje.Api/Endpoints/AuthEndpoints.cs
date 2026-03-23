using Pecenje.Api.Contracts.Auth;
using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Services;

namespace Pecenje.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth").WithTags("Auth");

        group.MapPost("/login", (LoginRequest? request, IAuthService authService) =>
        {
            try
            {
                if (request is null || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                {
                    return Results.Json(
                        new ApiEnvelope<object>(
                            Data: null,
                            Errors: [new ApiError("AUTH_INVALID", "Внеси корисничко име и лозинка.")]),
                        statusCode: StatusCodes.Status400BadRequest);
                }

                return Results.Ok(new ApiEnvelope<LoginResponse>(authService.Login(request)));
            }
            catch (UnauthorizedAccessException exception)
            {
                return Results.Json(
                    new ApiEnvelope<object>(
                        Data: null,
                        Errors: [new ApiError("AUTH_INVALID", exception.Message)]),
                    statusCode: StatusCodes.Status401Unauthorized);
            }
            catch
            {
                return Results.Json(
                    new ApiEnvelope<object>(
                        Data: null,
                        Errors: [new ApiError("AUTH_ERROR", "Најавата моментално не е достапна. Провери го серверот и пробај повторно.")]),
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }
        });

        group.MapPost("/refresh", () => Results.Ok(
            new ApiEnvelope<object>(new
            {
                accessToken = "demo-token-refreshed"
            })));

        group.MapPost("/logout", () => Results.NoContent());

        return app;
    }
}
