using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Infrastructure.SqlServer.SqlQueries;
using Dapper;

namespace Pecenje.Api.Infrastructure.SqlServer;

public sealed class SqlServerMasterDataSyncRunRepository(IAppSqlConnectionFactory connectionFactory) : IMasterDataSyncRunRepository
{
    public Task<long> StartAsync(string syncType, string sourceSystem, CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        return connection.ExecuteScalarAsync<long>(new CommandDefinition(
            SyncRunSql.InsertSyncRun,
            new
            {
                SyncType = syncType,
                SourceSystem = sourceSystem
            },
            cancellationToken: cancellationToken));
    }

    public Task FinishAsync(
        long syncRunId,
        string statusCode,
        int readCount,
        int insertedCount,
        int updatedCount,
        int deactivatedCount,
        string? errorMessage,
        CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        return connection.ExecuteAsync(new CommandDefinition(
            SyncRunSql.FinishSyncRun,
            new
            {
                SyncRunId = syncRunId,
                StatusCode = statusCode,
                ReadCount = readCount,
                InsertedCount = insertedCount,
                UpdatedCount = updatedCount,
                DeactivatedCount = deactivatedCount,
                ErrorMessage = errorMessage
            },
            cancellationToken: cancellationToken));
    }
}
