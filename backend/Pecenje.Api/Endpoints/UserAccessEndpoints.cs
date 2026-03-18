using Pecenje.Api.Application.Services;
using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.Users;

namespace Pecenje.Api.Endpoints;

public static class UserAccessEndpoints
{
    public static IEndpointRouteBuilder MapUserAccessEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/users").WithTags("Users");

        group.MapGet("/", async (UserAccessAppService appService, CancellationToken cancellationToken) =>
            Results.Ok(new ApiEnvelope<IReadOnlyList<UserSummaryDto>>(await appService.GetUsersAsync(cancellationToken))));

        group.MapGet("/{userId:long}/locations", async (long userId, UserAccessAppService appService, CancellationToken cancellationToken) =>
            Results.Ok(new ApiEnvelope<IReadOnlyList<UserLocationPermissionDto>>(await appService.GetUserLocationsAsync(userId, cancellationToken))));

        group.MapPut("/{userId:long}/locations", async (long userId, UpdateUserLocationsRequest request, UserAccessAppService appService, CancellationToken cancellationToken) =>
            Results.Ok(new ApiEnvelope<IReadOnlyList<UserLocationPermissionDto>>(await appService.UpdateUserLocationsAsync(userId, request, cancellationToken))));

        return app;
    }
}
