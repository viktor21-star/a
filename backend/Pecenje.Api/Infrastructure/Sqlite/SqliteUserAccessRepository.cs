using Dapper;
using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Users;

namespace Pecenje.Api.Infrastructure.Sqlite;

public sealed class SqliteUserAccessRepository : IUserAccessRepository
{
    private readonly LocalAppDb localAppDb;

    public SqliteUserAccessRepository(LocalAppDb localAppDb)
    {
        this.localAppDb = localAppDb;
        SeedDefaults();
    }

    public async Task<IReadOnlyList<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        using var connection = localAppDb.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        var rows = await connection.QueryAsync<UserSummaryRow>(
            """
            SELECT UserId, Username, FullName, RoleCode, IsActive
            FROM LocalUsers
            ORDER BY FullName
            """);
        return rows.Select(MapSummary).ToArray();
    }

    public async Task<UserSummaryDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = localAppDb.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        using var transaction = connection.BeginTransaction();

        var nextId = await connection.ExecuteScalarAsync<long>(
            "SELECT COALESCE(MAX(UserId), 0) + 1 FROM LocalUsers",
            transaction: transaction);

        await connection.ExecuteAsync(
            """
            INSERT INTO LocalUsers (UserId, Username, FullName, PasswordHash, RoleCode, DefaultLocationId, IsActive)
            VALUES (@UserId, @Username, @FullName, @PasswordHash, @RoleCode, @DefaultLocationId, @IsActive)
            """,
            new
            {
                UserId = nextId,
                request.Username,
                request.FullName,
                PasswordHash = request.Password,
                request.RoleCode,
                request.DefaultLocationId,
                IsActive = request.IsActive ? 1 : 0
            },
            transaction);

        await connection.ExecuteAsync(
            """
            INSERT INTO LocalUserLocations (
                UserId, LocationId, LocationName, CanPlan, CanBake, CanRecordWaste, CanViewReports, CanApprovePlan,
                CanUsePekara, CanUsePecenjara, CanUsePijara, PekaraOvenType, PecenjaraOvenType
            ) VALUES (
                @UserId, @LocationId, @LocationName, @CanPlan, @CanBake, @CanRecordWaste, @CanViewReports, @CanApprovePlan,
                @CanUsePekara, @CanUsePecenjara, @CanUsePijara, @PekaraOvenType, @PecenjaraOvenType
            )
            """,
            new
            {
                UserId = nextId,
                LocationId = request.DefaultLocationId,
                LocationName = GetLocationName(request.DefaultLocationId),
                CanPlan = request.RoleCode is "administrator" or "market_manager" ? 1 : 0,
                CanBake = request.CanUsePekara || request.CanUsePecenjara || request.CanUsePijara ? 1 : 0,
                CanRecordWaste = request.RoleCode is "administrator" or "market_manager" || request.CanUsePekara || request.CanUsePecenjara || request.CanUsePijara ? 1 : 0,
                CanViewReports = request.RoleCode is "administrator" or "market_manager" ? 1 : 0,
                CanApprovePlan = request.RoleCode == "administrator" ? 1 : 0,
                CanUsePekara = request.CanUsePekara ? 1 : 0,
                CanUsePecenjara = request.CanUsePecenjara ? 1 : 0,
                CanUsePijara = request.CanUsePijara ? 1 : 0,
                request.PekaraOvenType,
                request.PecenjaraOvenType
            },
            transaction);

        transaction.Commit();
        return new UserSummaryDto(nextId, request.Username, request.FullName, request.RoleCode, request.IsActive);
    }

    public async Task<UserSummaryDto> UpdateUserAccountAsync(long userId, UpdateUserAccountRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = localAppDb.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        await connection.ExecuteAsync(
            """
            UPDATE LocalUsers
            SET
                IsActive = @IsActive,
                PasswordHash = CASE
                    WHEN @PasswordHash IS NULL OR @PasswordHash = '' THEN PasswordHash
                    ELSE @PasswordHash
                END
            WHERE UserId = @UserId
            """,
            new
            {
                UserId = userId,
                IsActive = request.IsActive ? 1 : 0,
                PasswordHash = request.NewPassword
            });

        var updated = await connection.QuerySingleAsync<UserSummaryRow>(
            """
            SELECT UserId, Username, FullName, RoleCode, IsActive
            FROM LocalUsers
            WHERE UserId = @UserId
            """,
            new { UserId = userId });

        return MapSummary(updated);
    }

    public async Task<IReadOnlyList<UserLocationPermissionDto>> GetUserLocationsAsync(long userId, CancellationToken cancellationToken = default)
    {
        using var connection = localAppDb.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        var rows = await connection.QueryAsync<UserLocationRow>(
            """
            SELECT
                LocationId,
                LocationName,
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
            FROM LocalUserLocations
            WHERE UserId = @UserId
            ORDER BY LocationName
            """,
            new { UserId = userId });

        return rows.Select(MapPermission).ToArray();
    }

    public async Task<IReadOnlyList<UserLocationPermissionDto>> UpdateUserLocationsAsync(long userId, UpdateUserLocationsRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = localAppDb.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        using var transaction = connection.BeginTransaction();

        await connection.ExecuteAsync("DELETE FROM LocalUserLocations WHERE UserId = @UserId", new { UserId = userId }, transaction);

        foreach (var location in request.Locations)
        {
            await connection.ExecuteAsync(
                """
                INSERT INTO LocalUserLocations (
                    UserId, LocationId, LocationName, CanPlan, CanBake, CanRecordWaste, CanViewReports, CanApprovePlan,
                    CanUsePekara, CanUsePecenjara, CanUsePijara, PekaraOvenType, PecenjaraOvenType
                ) VALUES (
                    @UserId, @LocationId, @LocationName, @CanPlan, @CanBake, @CanRecordWaste, @CanViewReports, @CanApprovePlan,
                    @CanUsePekara, @CanUsePecenjara, @CanUsePijara, @PekaraOvenType, @PecenjaraOvenType
                )
                """,
                new
                {
                    UserId = userId,
                    location.LocationId,
                    LocationName = string.IsNullOrWhiteSpace(location.LocationName) ? GetLocationName(location.LocationId) : location.LocationName,
                    CanPlan = location.CanPlan ? 1 : 0,
                    CanBake = location.CanBake ? 1 : 0,
                    CanRecordWaste = location.CanRecordWaste || location.CanUsePekara || location.CanUsePecenjara || location.CanUsePijara ? 1 : 0,
                    CanViewReports = location.CanViewReports ? 1 : 0,
                    CanApprovePlan = location.CanApprovePlan ? 1 : 0,
                    CanUsePekara = location.CanUsePekara ? 1 : 0,
                    CanUsePecenjara = location.CanUsePecenjara ? 1 : 0,
                    CanUsePijara = location.CanUsePijara ? 1 : 0,
                    location.PekaraOvenType,
                    location.PecenjaraOvenType
                },
                transaction);
        }

        transaction.Commit();
        return await GetUserLocationsAsync(userId, cancellationToken);
    }

    public async Task<UserAuthenticationResultDto?> AuthenticateAsync(string username, string password, CancellationToken cancellationToken = default)
    {
        using var connection = localAppDb.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var user = await connection.QuerySingleOrDefaultAsync<AuthenticatedUserRow>(
            """
            SELECT UserId, Username, FullName, RoleCode, DefaultLocationId, IsActive
            FROM LocalUsers
            WHERE lower(Username) = lower(@Username)
              AND PasswordHash = @Password
              AND IsActive = 1
            """,
            new { Username = username, Password = password });

        if (user is null)
        {
            return null;
        }

        var locations = await GetUserLocationsAsync(user.UserId, cancellationToken);
        return new UserAuthenticationResultDto(
            user.UserId,
            user.Username,
            user.FullName,
            user.RoleCode,
            user.DefaultLocationId,
            user.IsActive,
            locations);
    }

    private void SeedDefaults()
    {
        using var connection = localAppDb.CreateConnection();
        connection.Open();
        var count = connection.ExecuteScalar<long>("SELECT COUNT(1) FROM LocalUsers");
        if (count > 0)
        {
            return;
        }

        using var transaction = connection.BeginTransaction();

        connection.Execute(
            """
            INSERT INTO LocalUsers (UserId, Username, FullName, PasswordHash, RoleCode, DefaultLocationId, IsActive) VALUES
            (1, 'admin', 'Администратор', '1234', 'administrator', 1, 1),
            (2, 'operator', 'Оператор Аеродром 1', '1111', 'operator', 1, 1),
            (3, 'manager', 'Шеф Центар', '2222', 'market_manager', 2, 1),
            (4, 'pekara.aer1', 'Пекар Аеродром 1', '1111', 'operator', 1, 1),
            (5, 'sef.centar', 'Шеф Центар', '2222', 'market_manager', 2, 1)
            """,
            transaction: transaction);

        connection.Execute(
            """
            INSERT INTO LocalUserLocations (
                UserId, LocationId, LocationName, CanPlan, CanBake, CanRecordWaste, CanViewReports, CanApprovePlan,
                CanUsePekara, CanUsePecenjara, CanUsePijara, PekaraOvenType, PecenjaraOvenType
            ) VALUES
            (1, 1, 'Аеродром 1', 1, 1, 1, 1, 1, 1, 1, 1, 'Ротациона', 'Комбинирана'),
            (1, 2, 'Центар', 1, 1, 1, 1, 1, 1, 1, 1, 'Камена', 'Ротациона'),
            (2, 1, 'Аеродром 1', 0, 1, 1, 0, 0, 1, 0, 0, 'Ротациона', 'Нема'),
            (3, 2, 'Центар', 1, 1, 1, 1, 1, 1, 1, 1, 'Комбинирана', 'Камена'),
            (4, 1, 'Аеродром 1', 0, 1, 1, 0, 0, 1, 0, 0, 'Ротациона', 'Нема'),
            (5, 2, 'Центар', 1, 1, 1, 1, 1, 1, 1, 1, 'Комбинирана', 'Камена')
            """,
            transaction: transaction);

        transaction.Commit();
    }

    private static UserSummaryDto MapSummary(UserSummaryRow row)
        => new(row.UserId, row.Username, row.FullName, row.RoleCode, row.IsActive);

    private static UserLocationPermissionDto MapPermission(UserLocationRow row)
        => new(
            row.LocationId,
            row.LocationName,
            row.CanPlan,
            row.CanBake,
            row.CanRecordWaste,
            row.CanViewReports,
            row.CanApprovePlan,
            row.CanUsePekara,
            row.CanUsePecenjara,
            row.CanUsePijara,
            row.PekaraOvenType,
            row.PecenjaraOvenType);

    private static string GetLocationName(int locationId)
        => locationId switch
        {
            1 => "Аеродром 1",
            2 => "Центар",
            _ => $"Локација {locationId}"
        };

    private sealed record UserSummaryRow(long UserId, string Username, string FullName, string RoleCode, bool IsActive);

    private sealed record UserLocationRow(
        int LocationId,
        string LocationName,
        bool CanPlan,
        bool CanBake,
        bool CanRecordWaste,
        bool CanViewReports,
        bool CanApprovePlan,
        bool CanUsePekara,
        bool CanUsePecenjara,
        bool CanUsePijara,
        string? PekaraOvenType,
        string? PecenjaraOvenType);

    private sealed record AuthenticatedUserRow(
        long UserId,
        string Username,
        string FullName,
        string RoleCode,
        int? DefaultLocationId,
        bool IsActive);
}
