namespace Pecenje.Api.Application.Abstractions;

public interface IAuditLogRepository
{
    Task WriteAsync(
        string entityName,
        string actionCode,
        string entityId,
        string payloadJson,
        CancellationToken cancellationToken = default);
}
