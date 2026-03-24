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

        group.MapGet("/{wasteEntryId:long}/photo", async (long wasteEntryId, ProductionAppService appService, CancellationToken cancellationToken) =>
        {
            var photo = await appService.GetWastePhotoAsync(wasteEntryId, cancellationToken);
            return photo is null
                ? Results.NotFound()
                : Results.Ok(new ApiEnvelope<Pecenje.Api.Contracts.Common.PhotoAssetDto>(photo));
        });

        group.MapPost("/", async (CreateWasteEntryRequest request, ProductionAppService appService, CancellationToken cancellationToken) =>
        {
            var created = await appService.CreateWasteAsync(request, cancellationToken);
            return Results.Created($"/api/v1/waste/{created.WasteEntryId}", new ApiEnvelope<WasteSummaryDto>(created));
        });

        return app;
    }
}
