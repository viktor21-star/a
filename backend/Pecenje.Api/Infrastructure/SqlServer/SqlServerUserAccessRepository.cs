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
                        location.CanUsePecenjara
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
}
