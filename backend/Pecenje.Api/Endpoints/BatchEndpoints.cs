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

        group.MapPost("/start", () => Results.Created("/api/v1/batches/9001", new { batchId = 9001, status = "во тек" }));
        group.MapPost("/{batchId:long}/finish", (long batchId) => Results.Ok(new { batchId, status = "завршено" }));
        group.MapPost("/{batchId:long}/cancel", (long batchId) => Results.Ok(new { batchId, status = "откажано" }));

        return app;
    }
}
