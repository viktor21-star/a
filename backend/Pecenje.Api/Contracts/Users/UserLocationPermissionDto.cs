namespace Pecenje.Api.Contracts.Users;

public sealed record UserLocationPermissionDto(
    int LocationId,
    string LocationName,
    bool CanPlan,
    bool CanBake,
    bool CanRecordWaste,
    bool CanViewReports,
    bool CanApprovePlan,
    bool CanUsePekara,
    bool CanUsePecenjara,
    string? OvenType = null
);
