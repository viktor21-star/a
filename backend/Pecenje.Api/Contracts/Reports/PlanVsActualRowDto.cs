namespace Pecenje.Api.Contracts.Reports;

public sealed record PlanVsActualRowDto(
    string LocationName,
    string ItemName,
    decimal PlannedQty,
    decimal BakedQty,
    decimal DifferenceQty,
    decimal RealizationPct
);

public sealed record ReportTotalsDto(
    decimal PlannedQty,
    decimal BakedQty,
    decimal DifferenceQty,
    decimal RealizationPct
);

public sealed record PlanVsActualReportDto(
    IReadOnlyList<PlanVsActualRowDto> Rows,
    ReportTotalsDto Totals
);
