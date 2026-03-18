using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.Dashboard;
using Pecenje.Api.Application.Services;

namespace Pecenje.Api.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/dashboard").WithTags("Dashboard");

        group.MapGet("/overview", async (DashboardAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<DashboardOverviewResponse>(await appService.GetOverviewAsync(cancellationToken))));

        return app;
    }
}
