using Pecenje.Api.Application.Services;
using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.MasterData;

namespace Pecenje.Api.Endpoints;

public static class TermEndpoints
{
    public static IEndpointRouteBuilder MapTermEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/master-data/terms").WithTags("MasterData");

        group.MapGet("/", async (TermAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<TermEntryDto>>(await appService.GetTermsAsync(cancellationToken))));

        group.MapPut("/", async (UpdateTermsRequest request, TermAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<TermEntryDto>>(await appService.SaveTermsAsync(request, cancellationToken))));

        return app;
    }
}
