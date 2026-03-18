using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Alerts;
using Pecenje.Api.Contracts.Dashboard;

namespace Pecenje.Api.Application.Services;

public sealed class DashboardAppService(
    IAnalyticsRepository analyticsRepository,
    LocationAccessAppService locationAccessAppService)
{
    public Task<DashboardOverviewResponse> GetOverviewAsync(CancellationToken cancellationToken = default)
        => analyticsRepository.GetDashboardOverviewAsync(cancellationToken);

    public async Task<IReadOnlyList<AlertDto>> GetAlertsAsync(CancellationToken cancellationToken = default)
    {
        var allowedLocationIds = await locationAccessAppService.GetAllowedLocationIdsAsync(cancellationToken);
        var alerts = await analyticsRepository.GetOpenAlertsAsync(cancellationToken);
        return alerts.Where(x => allowedLocationIds.Contains(x.LocationId)).ToList();
    }
}
