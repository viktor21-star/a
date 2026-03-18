using Pecenje.Api.Contracts.Alerts;
using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Application.Services;

namespace Pecenje.Api.Endpoints;

public static class AlertEndpoints
{
    public static IEndpointRouteBuilder MapAlertEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/alerts").WithTags("Alerts");

        group.MapGet("/", async (DashboardAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<IReadOnlyList<AlertDto>>(await appService.GetAlertsAsync(cancellationToken))));

        group.MapPost("/{alertId:long}/acknowledge", (long alertId) => Results.Ok(
            new ApiEnvelope<object>(new { alertId, status = "во обработка" })));

        group.MapPost("/{alertId:long}/resolve", (long alertId) => Results.Ok(
            new ApiEnvelope<object>(new { alertId, status = "затворено" })));

        return app;
    }
}
