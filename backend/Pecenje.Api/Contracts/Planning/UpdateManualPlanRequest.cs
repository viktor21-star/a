namespace Pecenje.Api.Contracts.Planning;

public sealed record UpdateManualPlanRequest(
    int LocationId,
    string PlannedTime,
    decimal PlannedQty
);
