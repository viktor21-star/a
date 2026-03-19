using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.Planning;
using Pecenje.Api.Application.Services;

namespace Pecenje.Api.Endpoints;

public static class PlanningEndpoints
{
    public static IEndpointRouteBuilder MapPlanningEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/baking-plans").WithTags("Planning");

        group.MapGet("/", async (PlanningAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<BakingPlanCardDto>>(await appService.GetPlansAsync(cancellationToken))));

        group.MapPost("/generate", () => Results.Accepted());
        group.MapPost("/", async (CreateManualPlanRequest request, PlanningAppService appService, CancellationToken cancellationToken) =>
        {
            var result = await appService.CreateManualPlanAsync(request, cancellationToken);
            return Results.Created($"/api/v1/baking-plans/{result.PlanHeaderId}", new ApiEnvelope<BakingPlanCardDto>(result));
        });
        group.MapPost("/{planHeaderId:long}/approve", (long planHeaderId) => Results.Ok(new { planHeaderId, status = "одобрено" }));

        return app;
    }
}
