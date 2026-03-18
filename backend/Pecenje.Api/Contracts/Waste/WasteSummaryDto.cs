namespace Pecenje.Api.Contracts.Waste;

public sealed record WasteSummaryDto(
    long WasteEntryId,
    int LocationId,
    string ItemName,
    decimal Quantity,
    string Reason,
    string LocationName
);
