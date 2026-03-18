using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Sync;
using Pecenje.Api.Infrastructure.SqlServer.SqlQueries;
using Dapper;

namespace Pecenje.Api.Infrastructure.SqlServer;

public sealed class SqlServerSourceMasterDataReader(ISourceSqlConnectionFactory connectionFactory) : ISourceMasterDataReader
{
    public async Task<IReadOnlyList<SourceLocationDto>> ReadLocationsAsync(CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<SourceLocationDto>(new CommandDefinition(
            SourceSyncSql.ReadLocationsFromOrged,
            cancellationToken: cancellationToken));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<SourceItemDto>> ReadItemsAsync(CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<SourceItemDto>(new CommandDefinition(
            SourceSyncSql.ReadItemsFromKatart,
            cancellationToken: cancellationToken));
        return rows.AsList();
    }
}
