using Pecenje.Api.Contracts.Auth;
using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Services;

namespace Pecenje.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth").WithTags("Auth");

        group.MapPost("/login", (LoginRequest request, IAuthService authService) => Results.Ok(
            new ApiEnvelope<LoginResponse>(authService.Login(request))));

        group.MapPost("/refresh", () => Results.Ok(
            new ApiEnvelope<object>(new
            {
                accessToken = "demo-token-refreshed"
            })));

        group.MapPost("/logout", () => Results.NoContent());

        return app;
    }
}
