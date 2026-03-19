namespace Pecenje.Api.Contracts.MasterData;

public sealed record TermEntryDto(
    string Id,
    string Label,
    string Time,
    bool IsActive
);

public sealed record UpdateTermsRequest(
    IReadOnlyList<TermEntryDto> Terms
);
