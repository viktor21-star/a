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

    public const string CreateUser = """
        DECLARE @RoleId INT;
        SELECT @RoleId = RoleId
        FROM dbo.Roles
        WHERE Code = @RoleCode;

        IF @RoleId IS NULL
        BEGIN
            THROW 51000, 'Role not found.', 1;
        END;

        INSERT INTO dbo.Users (
            Username,
            FullName,
            PasswordHash,
            RoleId,
            DefaultLocationId,
            IsActive
        )
        VALUES (
            @Username,
            @FullName,
            @PasswordHash,
            @RoleId,
            @DefaultLocationId,
            @IsActive
        );

        SELECT
            u.UserId,
            u.Username,
            u.FullName,
            r.Code AS RoleCode,
            u.IsActive
        FROM dbo.Users u
        INNER JOIN dbo.Roles r ON r.RoleId = u.RoleId
        WHERE u.UserId = CAST(SCOPE_IDENTITY() AS BIGINT);
        """;

    public const string UpdateUserAccount = """
        UPDATE dbo.Users
        SET
            IsActive = @IsActive,
            PasswordHash = CASE
                WHEN @PasswordHash IS NULL OR @PasswordHash = '' THEN PasswordHash
                ELSE @PasswordHash
            END
        WHERE UserId = @UserId;

        SELECT
            u.UserId,
            u.Username,
            u.FullName,
            r.Code AS RoleCode,
            u.IsActive
        FROM dbo.Users u
        INNER JOIN dbo.Roles r ON r.RoleId = u.RoleId
        WHERE u.UserId = @UserId;
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
            ul.CanUsePecenjara,
            ul.CanUsePijara,
            ul.PekaraOvenType,
            ul.PecenjaraOvenType
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
            CanUsePecenjara,
            CanUsePijara,
            PekaraOvenType,
            PecenjaraOvenType
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
            @CanUsePecenjara,
            @CanUsePijara,
            @PekaraOvenType,
            @PecenjaraOvenType
        );
        """;

    public const string AuthenticateUser = """
        SELECT TOP (1)
            u.UserId,
            u.Username,
            u.FullName,
            r.Code AS RoleCode,
            u.DefaultLocationId,
            u.IsActive
        FROM dbo.Users u
        INNER JOIN dbo.Roles r ON r.RoleId = u.RoleId
        WHERE u.Username = @Username
          AND u.PasswordHash = @Password
          AND u.IsActive = 1;
        """;
}
