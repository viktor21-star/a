using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Users;
using Pecenje.Api.Infrastructure.SqlServer.SqlQueries;
using Dapper;
using System.Data.Common;

namespace Pecenje.Api.Infrastructure.SqlServer;

public sealed class SqlServerUserAccessRepository(IAppSqlConnectionFactory connectionFactory) : IUserAccessRepository
{
    public async Task<IReadOnlyList<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<UserSummaryDto>(new CommandDefinition(
            UserAccessSql.GetUsers,
            cancellationToken: cancellationToken));
        return rows.AsList();
    }

    public async Task<UserSummaryDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        var created = await connection.QuerySingleAsync<UserSummaryDto>(new CommandDefinition(
            UserAccessSql.CreateUser,
            new
            {
                request.DefaultLocationId,
                request.Username,
                request.FullName,
                request.RoleCode,
                request.IsActive,
                PasswordHash = request.Password
            },
            cancellationToken: cancellationToken));

        return created;
    }

    public async Task<UserSummaryDto> UpdateUserAccountAsync(long userId, UpdateUserAccountRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        var updated = await connection.QuerySingleAsync<UserSummaryDto>(new CommandDefinition(
            UserAccessSql.UpdateUserAccount,
            new
            {
                UserId = userId,
                request.IsActive,
                PasswordHash = request.NewPassword
            },
            cancellationToken: cancellationToken));

        return updated;
    }

    public async Task<IReadOnlyList<UserLocationPermissionDto>> GetUserLocationsAsync(long userId, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<UserLocationPermissionDto>(new CommandDefinition(
            UserAccessSql.GetUserLocations,
            new { UserId = userId },
            cancellationToken: cancellationToken));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<UserLocationPermissionDto>> UpdateUserLocationsAsync(long userId, UpdateUserLocationsRequest request, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        if (connection is DbConnection dbConnection)
        {
          await dbConnection.OpenAsync(cancellationToken);
        }
        else
        {
          connection.Open();
        }
        using var transaction = connection.BeginTransaction();

        try
        {
            await connection.ExecuteAsync(new CommandDefinition(
                UserAccessSql.DeleteUserLocations,
                new { UserId = userId },
                transaction: transaction,
                cancellationToken: cancellationToken));

            foreach (var location in request.Locations)
            {
                await connection.ExecuteAsync(new CommandDefinition(
                    UserAccessSql.InsertUserLocation,
                    new
                    {
                        UserId = userId,
                        location.LocationId,
                        location.CanPlan,
                        location.CanBake,
                        location.CanRecordWaste,
                        location.CanViewReports,
                        location.CanApprovePlan,
                        location.CanUsePekara,
                        location.CanUsePecenjara,
                        location.CanUsePijara,
                        location.PekaraOvenType,
                        location.PecenjaraOvenType
                    },
                    transaction: transaction,
                    cancellationToken: cancellationToken));
            }

            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }

        return await GetUserLocationsAsync(userId, cancellationToken);
    }

    public async Task<UserAuthenticationResultDto?> AuthenticateAsync(string username, string password, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        var user = await connection.QuerySingleOrDefaultAsync<UserAuthenticationRow>(new CommandDefinition(
            UserAccessSql.AuthenticateUser,
            new { Username = username, Password = password },
            cancellationToken: cancellationToken));

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

    private sealed record UserAuthenticationRow(
        long UserId,
        string Username,
        string FullName,
        string RoleCode,
        int? DefaultLocationId,
        bool IsActive
    );
}
