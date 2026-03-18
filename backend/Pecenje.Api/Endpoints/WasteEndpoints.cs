using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.Waste;
using Pecenje.Api.Application.Services;

namespace Pecenje.Api.Endpoints;

public static class WasteEndpoints
{
    public static IEndpointRouteBuilder MapWasteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/waste").WithTags("Waste");

        group.MapGet("/", async (ProductionAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<WasteSummaryDto>>(await appService.GetWasteAsync(cancellationToken))));

        group.MapPost("/", () => Results.Created("/api/v1/waste/81", new { wasteEntryId = 81 }));

        return app;
    }
}
