using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Reports;

namespace Pecenje.Api.Application.Services;

public sealed class ReportingAppService(IAnalyticsRepository analyticsRepository)
{
    public Task<PlanVsActualReportDto> GetPlanVsActualAsync(CancellationToken cancellationToken = default)
        => analyticsRepository.GetPlanVsActualAsync(cancellationToken);
}
