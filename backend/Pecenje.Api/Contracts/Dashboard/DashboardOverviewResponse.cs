namespace Pecenje.Api.Contracts.Dashboard;

public sealed record DashboardOverviewResponse(
    DateOnly Date,
    DashboardKpiDto Network,
    int AlertsOpen,
    IReadOnlyList<ProblemItemDto> TopProblemItems,
    IReadOnlyList<ProblemLocationDto> TopProblemLocations
);

public sealed record DashboardKpiDto(
    decimal RealizationPct,
    decimal WastePct,
    decimal SalesPct,
    decimal OnTimePct
);

public sealed record ProblemItemDto(
    int ItemId,
    string ItemName,
    decimal WastePct,
    decimal ShortagePct
);

public sealed record ProblemLocationDto(
    int LocationId,
    string LocationName,
    int Score
);
