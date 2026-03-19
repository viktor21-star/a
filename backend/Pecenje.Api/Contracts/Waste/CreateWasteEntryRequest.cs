namespace Pecenje.Api.Contracts.Waste;

public sealed record CreateWasteEntryRequest(
    string SourceMode,
    int LocationId,
    string LocationName,
    string ItemName,
    decimal Quantity,
    string Reason,
    string Note,
    string PhotoDataUrl,
    string PhotoName,
    string CreatedAt
);
