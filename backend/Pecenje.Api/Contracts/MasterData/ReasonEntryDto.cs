namespace Pecenje.Api.Contracts.MasterData;

public sealed record ReasonEntryDto(
    string Id,
    string Code,
    string Name,
    string Category,
    bool IsActive
);

public sealed record UpdateReasonsRequest(
    IReadOnlyList<ReasonEntryDto> Reasons
);
