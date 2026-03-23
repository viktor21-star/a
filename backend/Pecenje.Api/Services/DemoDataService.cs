using Pecenje.Api.Contracts.Alerts;
using Pecenje.Api.Contracts.Dashboard;
using Pecenje.Api.Contracts.Planning;
using Pecenje.Api.Contracts.Production;
using Pecenje.Api.Contracts.Reports;
using Pecenje.Api.Contracts.Waste;

namespace Pecenje.Api.Services;

public sealed class DemoDataService
{
    public DashboardOverviewResponse GetDashboardOverview()
    {
        return new DashboardOverviewResponse(
            DateOnly.FromDateTime(DateTime.Today),
            new DashboardKpiDto(0m, 0m, 0m, 0m),
            0,
            [],
            []
        );
    }

    public IReadOnlyList<BakingPlanCardDto> GetPlans()
    {
        return [];
    }

    public string GetLocationName(int locationId) => locationId switch
    {
        1 => "Аеродром 1",
        2 => "Центар",
        3 => "Карпош",
        4 => "Битола 1",
        _ => $"Локација {locationId}"
    };

    public IReadOnlyList<BatchDetailDto> GetBatches()
    {
        return [];
    }

    public IReadOnlyList<WasteSummaryDto> GetWasteEntries()
    {
        return [];
    }

    public IReadOnlyList<AlertDto> GetAlerts()
    {
        return [];
    }

    public PlanVsActualReportDto GetPlanVsActualReport()
    {
        return new PlanVsActualReportDto(
            [],
            new ReportTotalsDto(0, 0, 0, 0)
        );
    }
}
