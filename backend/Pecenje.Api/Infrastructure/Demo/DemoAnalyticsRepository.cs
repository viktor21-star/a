using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Alerts;
using Pecenje.Api.Contracts.Dashboard;
using Pecenje.Api.Contracts.Reports;
using Pecenje.Api.Services;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class DemoAnalyticsRepository(DemoDataService demoDataService) : IAnalyticsRepository
{
    public Task<DashboardOverviewResponse> GetDashboardOverviewAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(demoDataService.GetDashboardOverview());
    }

    public Task<IReadOnlyList<AlertDto>> GetOpenAlertsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(demoDataService.GetAlerts());
    }

    public Task<PlanVsActualReportDto> GetPlanVsActualAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(demoDataService.GetPlanVsActualReport());
    }
}
