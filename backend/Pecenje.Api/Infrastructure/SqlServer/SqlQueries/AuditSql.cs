namespace Pecenje.Api.Infrastructure.SqlServer.SqlQueries;

public static class AuditSql
{
    public const string InsertAuditLog = """
        INSERT INTO dbo.AuditLogs (
            EntityName,
            EntityId,
            ActionCode,
            OldValues,
            NewValues,
            ChangedAt
        )
        VALUES (
            @EntityName,
            @EntityId,
            @ActionCode,
            NULL,
            @PayloadJson,
            SYSUTCDATETIME()
        );
        """;
}
