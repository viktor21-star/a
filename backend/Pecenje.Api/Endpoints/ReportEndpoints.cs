using Pecenje.Api.Contracts.Common;
using Pecenje.Api.Contracts.Reports;
using Pecenje.Api.Application.Services;

namespace Pecenje.Api.Endpoints;

public static class ReportEndpoints
{
    public static IEndpointRouteBuilder MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/reports").WithTags("Reports");

        group.MapGet("/plan-vs-actual", async (ReportingAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<PlanVsActualReportDto>(await appService.GetPlanVsActualAsync(cancellationToken))));

        group.MapGet("/plan-vs-actual/export/excel", async (ReportingAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<ReportExportDto>(await appService.ExportPlanVsActualExcelAsync(cancellationToken))));

        group.MapGet("/plan-vs-actual/export/pdf", async (ReportingAppService appService, CancellationToken cancellationToken) => Results.Ok(
            new ApiEnvelope<ReportExportDto>(await appService.ExportPlanVsActualPdfAsync(cancellationToken))));

        group.MapGet("/financial", () => Results.Ok(
            new ApiEnvelope<object>(
                new
                {
                    wasteValue = 15240.50m,
                    lostMargin = 6200.00m
                }
            )));

        return app;
    }
}
