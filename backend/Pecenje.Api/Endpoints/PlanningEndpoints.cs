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
        group.MapPost("/", () => Results.Created("/api/v1/baking-plans/501", new { planHeaderId = 501 }));
        group.MapPost("/{planHeaderId:long}/approve", (long planHeaderId) => Results.Ok(new { planHeaderId, status = "одобрено" }));

        return app;
    }
}
