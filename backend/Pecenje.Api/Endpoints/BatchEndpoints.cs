using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.Production;
using Pecenje.Api.Application.Services;

namespace Pecenje.Api.Endpoints;

public static class BatchEndpoints
{
    public static IEndpointRouteBuilder MapBatchEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/batches").WithTags("Production");

        group.MapGet("/", async (ProductionAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<BatchDetailDto>>(await appService.GetBatchesAsync(cancellationToken))));

        group.MapGet("/entries", async (ProductionAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<OperatorEntryDto>>(await appService.GetOperatorEntriesAsync(cancellationToken))));

        group.MapGet("/entries/{entryId}/photo", async (string entryId, ProductionAppService appService, CancellationToken cancellationToken) =>
        {
            var photo = await appService.GetOperatorEntryPhotoAsync(entryId, cancellationToken);
            return photo is null
                ? Results.NotFound()
                : Results.Ok(new ApiEnvelope<Pecenje.Api.Contracts.Common.PhotoAssetDto>(photo));
        });

        group.MapPost("/entries", async (CreateOperatorEntryRequest request, ProductionAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<OperatorEntryDto>(await appService.CreateOperatorEntryAsync(request, cancellationToken))));

        group.MapPost("/start", () => Results.Created("/api/v1/batches/9001", new { batchId = 9001, status = "во тек" }));
        group.MapPost("/{batchId:long}/finish", (long batchId) => Results.Ok(new { batchId, status = "завршено" }));
        group.MapPost("/{batchId:long}/cancel", (long batchId) => Results.Ok(new { batchId, status = "откажано" }));

        return app;
    }
}
