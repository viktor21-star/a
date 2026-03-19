using Pecenje.Api.Application.Services;
using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.MasterData;

namespace Pecenje.Api.Endpoints;

public static class ReasonEndpoints
{
    public static IEndpointRouteBuilder MapReasonEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/master-data/reasons").WithTags("MasterData");

        group.MapGet("/", async (ReasonAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<ReasonEntryDto>>(await appService.GetReasonsAsync(cancellationToken))));

        group.MapPut("/", async (UpdateReasonsRequest request, ReasonAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<ReasonEntryDto>>(await appService.SaveReasonsAsync(request, cancellationToken))));

        return app;
    }
}
