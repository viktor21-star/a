namespace Pecenje.Api.Contracts.Production;

public sealed record BatchSummaryDto(
    long BatchId,
    string ItemName,
    string LocationName,
    decimal ActualQty,
    string Status
);

public sealed record BatchDetailDto(
    long BatchId,
    int LocationId,
    string ItemName,
    string LocationName,
    string ShiftName,
    string TermLabel,
    decimal ActualQty,
    string Status,
    string OperatorName,
    string StartTime,
    string? EndTime
);
