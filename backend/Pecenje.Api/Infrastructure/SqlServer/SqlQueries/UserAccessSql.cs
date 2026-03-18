namespace Pecenje.Api.Infrastructure.SqlServer.SqlQueries;

public static class UserAccessSql
{
    public const string GetUsers = """
        SELECT
            u.UserId,
            u.Username,
            u.FullName,
            r.Code AS RoleCode,
            u.IsActive
        FROM dbo.Users u
        INNER JOIN dbo.Roles r ON r.RoleId = u.RoleId
        ORDER BY u.FullName;
        """;

    public const string GetUserLocations = """
        SELECT
            ul.LocationId,
            l.NameMk AS LocationName,
            ul.CanPlan,
            ul.CanBake,
            ul.CanRecordWaste,
            ul.CanViewReports,
            ul.CanApprovePlan,
            ul.CanUsePekara,
            ul.CanUsePecenjara
        FROM dbo.UserLocations ul
        INNER JOIN dbo.Locations l ON l.LocationId = ul.LocationId
        WHERE ul.UserId = @UserId
        ORDER BY l.NameMk;
        """;

    public const string DeleteUserLocations = """
        DELETE FROM dbo.UserLocations
        WHERE UserId = @UserId;
        """;

    public const string InsertUserLocation = """
        INSERT INTO dbo.UserLocations (
            UserId,
            LocationId,
            CanPlan,
            CanBake,
            CanRecordWaste,
            CanViewReports,
            CanApprovePlan,
            CanUsePekara,
            CanUsePecenjara
        )
        VALUES (
            @UserId,
            @LocationId,
            @CanPlan,
            @CanBake,
            @CanRecordWaste,
            @CanViewReports,
            @CanApprovePlan,
            @CanUsePekara,
            @CanUsePecenjara
        );
        """;
}
