using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Alerts;
using Pecenje.Api.Contracts.Dashboard;
using Pecenje.Api.Contracts.Planning;
using Pecenje.Api.Contracts.Production;
using Pecenje.Api.Contracts.Reports;
using Pecenje.Api.Services;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class DemoAnalyticsRepository(
    DemoDataService demoDataService,
    IPlanningRepository planningRepository,
    InMemoryOperatorEntryStore operatorEntryStore) : IAnalyticsRepository
{
    public Task<DashboardOverviewResponse> GetDashboardOverviewAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(demoDataService.GetDashboardOverview());
    }

    public Task<IReadOnlyList<AlertDto>> GetOpenAlertsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(demoDataService.GetAlerts());
    }

    public async Task<PlanVsActualReportDto> GetPlanVsActualAsync(CancellationToken cancellationToken = default)
    {
        var plans = await planningRepository.GetDailyPlansAsync(cancellationToken);
        var entries = operatorEntryStore.GetAll()
            .Where(entry => entry.Mode is "pekara" or "pecenjara")
            .ToArray();

        var rows = plans
            .Where(plan => plan.Mode is "pekara" or "pecenjara")
            .Select(plan => MapPlanRow(plan, entries))
            .OrderBy(row => row.LocationName)
            .ThenBy(row => row.PlannedTime)
            .ThenBy(row => row.ItemName)
            .ToArray();

        var totals = new ReportTotalsDto(
            rows.Sum(row => row.PlannedQty),
            rows.Sum(row => row.BakedQty),
            rows.Sum(row => row.DifferenceQty),
            rows.Sum(row => row.PlannedQty) > 0
                ? Math.Round(rows.Sum(row => row.BakedQty) / rows.Sum(row => row.PlannedQty) * 100m, 2)
                : 0m);

        return new PlanVsActualReportDto(rows, totals);
    }

    private static PlanVsActualRowDto MapPlanRow(BakingPlanCardDto plan, IReadOnlyList<OperatorEntryDto> entries)
    {
        var matchingEntries = entries
            .Where(entry =>
                entry.LocationId == plan.LocationId &&
                string.Equals(entry.Mode, plan.Mode, StringComparison.OrdinalIgnoreCase) &&
                MatchesPlanDate(entry.CreatedAt, plan.PlanDate))
            .OrderBy(entry => ParseTimestamp(entry.CreatedAt) ?? DateTimeOffset.MaxValue)
            .ToArray();

        var bakedQty = matchingEntries.Sum(entry => entry.Items.Sum(item => item.Quantity));
        var differenceQty = bakedQty - plan.CorrectedQty;
        var realizationPct = plan.CorrectedQty > 0
            ? Math.Round(bakedQty / plan.CorrectedQty * 100m, 2)
            : 0m;

        var firstEntryTime = matchingEntries.FirstOrDefault()?.CreatedAt;
        var actualTime = ParseTimestamp(firstEntryTime)?.ToString("HH:mm");
        var plannedDateTime = ParsePlannedDateTime(plan.PlanDate, plan.TermLabel);
        var actualDateTime = ParseTimestamp(firstEntryTime);
        int? delayMinutes = plannedDateTime is not null && actualDateTime is not null
            ? (int)Math.Round((actualDateTime.Value - plannedDateTime.Value).TotalMinutes, MidpointRounding.AwayFromZero)
            : null;

        return new PlanVsActualRowDto(
            plan.LocationName,
            plan.ItemName,
            plan.Mode,
            plan.PlanDate.ToString("yyyy-MM-dd"),
            plan.CorrectedQty,
            bakedQty,
            differenceQty,
            realizationPct,
            plan.TermLabel,
            actualTime,
            delayMinutes,
            ResolveTimingStatus(actualDateTime, plannedDateTime, delayMinutes));
    }

    private static string ResolveTimingStatus(DateTimeOffset? actualDateTime, DateTimeOffset? plannedDateTime, int? delayMinutes)
    {
        if (actualDateTime is null || plannedDateTime is null)
        {
            return "Без внес";
        }

        if (delayMinutes is null || delayMinutes <= 0)
        {
            return "Навреме";
        }

        return "Доцни";
    }

    private static bool MatchesPlanDate(string createdAt, DateOnly planDate)
    {
        var timestamp = ParseTimestamp(createdAt);
        return timestamp?.Date == planDate.ToDateTime(TimeOnly.MinValue).Date;
    }

    private static DateTimeOffset? ParseTimestamp(string? value)
    {
        return DateTimeOffset.TryParse(value, out var parsed) ? parsed : null;
    }

    private static DateTimeOffset? ParsePlannedDateTime(DateOnly planDate, string? termLabel)
    {
        if (!TimeOnly.TryParse(termLabel, out var parsedTime))
        {
            return null;
        }

        var localDateTime = planDate.ToDateTime(parsedTime);
        return new DateTimeOffset(localDateTime);
    }
}
