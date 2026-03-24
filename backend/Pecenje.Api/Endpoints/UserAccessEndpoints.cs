using Pecenje.Api.Application.Services;
using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.Users;
using System.Net;

namespace Pecenje.Api.Endpoints;

public static class UserAccessEndpoints
{
    public static IEndpointRouteBuilder MapUserAccessEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/users").WithTags("Users");

        group.MapGet("/", async (UserAccessAppService appService, CancellationToken cancellationToken) =>
            Results.Ok(new ApiEnvelope<IReadOnlyList<UserSummaryDto>>(await appService.GetUsersAsync(cancellationToken))));

        group.MapPost("/", async (CreateUserRequest request, UserAccessAppService appService, CancellationToken cancellationToken) =>
        {
            try
            {
                return Results.Ok(new ApiEnvelope<UserSummaryDto>(await appService.CreateUserAsync(request, cancellationToken)));
            }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
            {
                return Results.Problem(
                    title: ex.Message,
                    statusCode: (int)HttpStatusCode.BadRequest);
            }
        });

        group.MapPut("/{userId:long}", async (long userId, UpdateUserAccountRequest request, UserAccessAppService appService, CancellationToken cancellationToken) =>
        {
            try
            {
                return Results.Ok(new ApiEnvelope<UserSummaryDto>(await appService.UpdateUserAccountAsync(userId, request, cancellationToken)));
            }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
            {
                return Results.Problem(
                    title: ex.Message,
                    statusCode: (int)HttpStatusCode.BadRequest);
            }
        });

        group.MapGet("/{userId:long}/locations", async (long userId, UserAccessAppService appService, CancellationToken cancellationToken) =>
            Results.Ok(new ApiEnvelope<IReadOnlyList<UserLocationPermissionDto>>(await appService.GetUserLocationsAsync(userId, cancellationToken))));

        group.MapPut("/{userId:long}/locations", async (long userId, UpdateUserLocationsRequest request, UserAccessAppService appService, CancellationToken cancellationToken) =>
        {
            try
            {
                return Results.Ok(new ApiEnvelope<IReadOnlyList<UserLocationPermissionDto>>(await appService.UpdateUserLocationsAsync(userId, request, cancellationToken)));
            }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
            {
                return Results.Problem(
                    title: ex.Message,
                    statusCode: (int)HttpStatusCode.BadRequest);
            }
        });

        return app;
    }
}
