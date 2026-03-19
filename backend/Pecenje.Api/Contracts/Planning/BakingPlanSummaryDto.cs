namespace Pecenje.Api.Contracts.Planning;

public sealed record BakingPlanSummaryDto(
    long PlanHeaderId,
    DateOnly PlanDate,
    int LocationId,
    string LocationName,
    string ShiftName,
    string Status
);

public sealed record BakingPlanCardDto(
    long PlanHeaderId,
    DateOnly PlanDate,
    int LocationId,
    string LocationName,
    string ShiftName,
    string TermLabel,
    string ItemName,
    decimal SuggestedQty,
    decimal CorrectedQty,
    string Mode,
    string Status
);
