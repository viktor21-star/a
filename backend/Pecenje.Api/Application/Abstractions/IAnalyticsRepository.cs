using Pecenje.Api.Contracts.Alerts;
using Pecenje.Api.Contracts.Dashboard;
using Pecenje.Api.Contracts.Reports;

namespace Pecenje.Api.Application.Abstractions;

public interface IAnalyticsRepository
{
    Task<DashboardOverviewResponse> GetDashboardOverviewAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AlertDto>> GetOpenAlertsAsync(CancellationToken cancellationToken = default);
    Task<PlanVsActualReportDto> GetPlanVsActualAsync(CancellationToken cancellationToken = default);
}
