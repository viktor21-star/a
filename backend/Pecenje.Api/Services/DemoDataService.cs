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
            new DashboardKpiDto(94.5m, 4.2m, 88.1m, 91.4m),
            12,
            new[]
            {
                new ProblemItemDto(101, "Бурек со месо", 12.5m, 2.1m),
                new ProblemItemDto(102, "Кифла", 1.4m, 8.4m),
                new ProblemItemDto(103, "Пица ролна", 7.8m, 3.2m)
            },
            new[]
            {
                new ProblemLocationDto(3, "Аеродром 1", 71),
                new ProblemLocationDto(7, "Центар", 68),
                new ProblemLocationDto(9, "Карпош", 63)
            }
        );
    }

    public IReadOnlyList<BakingPlanCardDto> GetPlans()
    {
        return new[]
        {
            new BakingPlanCardDto(501, DateOnly.FromDateTime(DateTime.Today), 1, "Аеродром 1", "Прва смена", "06:00", "Бурек со сирење", 40, 44, "одобрено"),
            new BakingPlanCardDto(502, DateOnly.FromDateTime(DateTime.Today), 1, "Аеродром 1", "Прва смена", "07:30", "Кифла", 60, 60, "во тек"),
            new BakingPlanCardDto(503, DateOnly.FromDateTime(DateTime.Today), 1, "Аеродром 1", "Прва смена", "09:00", "Лиснато", 35, 30, "не започнато")
        };
    }

    public IReadOnlyList<BatchDetailDto> GetBatches()
    {
        return new[]
        {
            new BatchDetailDto(9001, 1, "Бурек со сирење", "Аеродром 1", "Прва смена", "06:00", 32, "во тек", "Петар Петров", "05:58", null),
            new BatchDetailDto(9002, 1, "Кифла", "Аеродром 1", "Прва смена", "07:30", 55, "завршено", "Ана Ангеловска", "07:29", "07:52")
        };
    }

    public IReadOnlyList<WasteSummaryDto> GetWasteEntries()
    {
        return new[]
        {
            new WasteSummaryDto(81, 2, "Лиснато тесто", 4, "препечено", "Центар"),
            new WasteSummaryDto(82, 1, "Кроасан", 3, "нераспродадено", "Аеродром 1")
        };
    }

    public IReadOnlyList<AlertDto> GetAlerts()
    {
        return new[]
        {
            new AlertDto(2001, 1, "критично", "Аеродром 1", "Бурек со месо", "Печење не е започнато навреме", "отворено"),
            new AlertDto(2002, 2, "средно", "Центар", "Кифла", "Отпад над лимит", "во обработка"),
            new AlertDto(2003, 3, "ниско", "Карпош", "Лиснато", "Печење над план", "отворено")
        };
    }

    public PlanVsActualReportDto GetPlanVsActualReport()
    {
        var rows = new[]
        {
            new PlanVsActualRowDto("Аеродром 1", "Бурек", 50, 46, -4, 92),
            new PlanVsActualRowDto("Центар", "Кифла", 70, 75, 5, 107),
            new PlanVsActualRowDto("Карпош", "Лиснато", 30, 28, -2, 93.3m)
        };

        return new PlanVsActualReportDto(
            rows,
            new ReportTotalsDto(150, 149, -1, 99.3m)
        );
    }
}
