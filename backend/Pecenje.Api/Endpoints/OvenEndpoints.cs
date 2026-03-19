using Pecenje.Api.Application.Services;
using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.MasterData;

namespace Pecenje.Api.Endpoints;

public static class OvenEndpoints
{
    public static IEndpointRouteBuilder MapOvenEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/master-data/ovens").WithTags("MasterData");

        group.MapGet("/", async (OvenConfigAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<LocationOvenConfigDto>>(await appService.GetLocationOvensAsync(cancellationToken))));

        group.MapPut("/", async (UpdateLocationOvensRequest request, OvenConfigAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<LocationOvenConfigDto>>(await appService.SaveLocationOvensAsync(request, cancellationToken))));

        return app;
    }
}
