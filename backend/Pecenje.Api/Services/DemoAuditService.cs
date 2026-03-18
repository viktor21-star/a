using System.Text.Json;
using Pecenje.Api.Application.Abstractions;

namespace Pecenje.Api.Services;

public sealed class DemoAuditService(IAuditLogRepository? auditLogRepository = null) : IAuditService
{
    public Task LogAsync(string entityName, string actionCode, string entityId, object payload, CancellationToken cancellationToken = default)
    {
        if (auditLogRepository is null)
        {
            return Task.CompletedTask;
        }

        return auditLogRepository.WriteAsync(
            entityName,
            actionCode,
            entityId,
            JsonSerializer.Serialize(payload),
            cancellationToken);
    }
}
