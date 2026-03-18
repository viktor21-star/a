using Pecenje.Api.Application.Services;
using Pecenje.Api.Contracts.Common;
using System.Net;

namespace Pecenje.Api.Endpoints;

public static class IntegrationEndpoints
{
    public static IEndpointRouteBuilder MapIntegrationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/integrations").WithTags("Integrations");

        group.MapPost("/master-data/sync", async (AdminAccessAppService adminAccess, MasterDataSyncAppService syncService, CancellationToken cancellationToken) =>
        {
            try
            {
                adminAccess.EnsureAdmin();
                var locations = await syncService.SyncLocationsAsync(cancellationToken);
                var items = await syncService.SyncItemsAsync(cancellationToken);

                return Results.Ok(new ApiEnvelope<object>(new
                {
                    locationsSynced = locations,
                    itemsSynced = items,
                    mode = "manual-admin-trigger"
                }));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Json(
                    new ApiEnvelope<object>(new { }, Errors: new[] { new ApiError("FORBIDDEN", ex.Message) }),
                    statusCode: (int)HttpStatusCode.Forbidden);
            }
        });

        return app;
    }
}
