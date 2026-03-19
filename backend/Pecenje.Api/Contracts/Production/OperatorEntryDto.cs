namespace Pecenje.Api.Contracts.Production;

public sealed record OperatorEntryLineDto(
    string ItemName,
    decimal Quantity,
    bool ClassB,
    decimal ClassBQuantity
);

public sealed record OperatorEntryDto(
    string Id,
    string Mode,
    int LocationId,
    string LocationName,
    IReadOnlyList<OperatorEntryLineDto> Items,
    string Note,
    string PhotoDataUrl,
    string PhotoName,
    string CreatedAt,
    long UserId,
    string OperatorName
);

public sealed record CreateOperatorEntryRequest(
    string Mode,
    int LocationId,
    string LocationName,
    IReadOnlyList<OperatorEntryLineDto> Items,
    string Note,
    string PhotoDataUrl,
    string PhotoName,
    string CreatedAt
);
