namespace Pecenje.Api.Services;

public interface IAuditService
{
    Task LogAsync(string entityName, string actionCode, string entityId, object payload, CancellationToken cancellationToken = default);
}
