namespace Pecenje.Api.Contracts.Planning;

public sealed record CreateManualPlanRequest(
    string Mode,
    int LocationId,
    string PlannedTime,
    decimal PlannedQty
);
