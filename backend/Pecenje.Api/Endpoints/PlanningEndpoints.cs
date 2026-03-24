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
        group.MapPut("/{planHeaderId:long}", async (long planHeaderId, UpdateManualPlanRequest request, PlanningAppService appService, CancellationToken cancellationToken) =>
            Results.Ok(new ApiEnvelope<BakingPlanCardDto>(await appService.UpdateManualPlanAsync(planHeaderId, request, cancellationToken))));
        group.MapDelete("/{planHeaderId:long}", async (long planHeaderId, PlanningAppService appService, CancellationToken cancellationToken) =>
        {
            await appService.DeleteManualPlanAsync(planHeaderId, cancellationToken);
            return Results.Ok(new ApiEnvelope<object?>(null));
        });
        group.MapPost("/{planHeaderId:long}/deactivate", async (long planHeaderId, PlanningAppService appService, CancellationToken cancellationToken) =>
            Results.Ok(new ApiEnvelope<BakingPlanCardDto>(await appService.UpdateManualPlanStatusAsync(planHeaderId, "неактивен", cancellationToken))));
        group.MapPost("/{planHeaderId:long}/activate", async (long planHeaderId, PlanningAppService appService, CancellationToken cancellationToken) =>
            Results.Ok(new ApiEnvelope<BakingPlanCardDto>(await appService.UpdateManualPlanStatusAsync(planHeaderId, "активен", cancellationToken))));
        group.MapPost("/{planHeaderId:long}/approve", (long planHeaderId) => Results.Ok(new { planHeaderId, status = "одобрено" }));

        return app;
    }
}
