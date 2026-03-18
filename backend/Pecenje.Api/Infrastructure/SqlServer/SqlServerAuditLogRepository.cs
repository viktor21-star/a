using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Infrastructure.SqlServer.SqlQueries;
using Dapper;

namespace Pecenje.Api.Infrastructure.SqlServer;

public sealed class SqlServerAuditLogRepository(IAppSqlConnectionFactory connectionFactory) : IAuditLogRepository
{
    public async Task WriteAsync(
        string entityName,
        string actionCode,
        string entityId,
        string payloadJson,
        CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        await connection.ExecuteAsync(new CommandDefinition(
            AuditSql.InsertAuditLog,
            new
            {
                EntityName = entityName,
                EntityId = entityId,
                ActionCode = actionCode,
                PayloadJson = payloadJson
            },
            cancellationToken: cancellationToken));
    }
}
