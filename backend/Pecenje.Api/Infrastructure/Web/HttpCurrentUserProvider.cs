using Pecenje.Api.Application.Abstractions;

namespace Pecenje.Api.Infrastructure.Web;

public sealed class HttpCurrentUserProvider(IHttpContextAccessor httpContextAccessor) : ICurrentUserProvider
{
    public long GetCurrentUserId()
    {
        var header = httpContextAccessor.HttpContext?.Request.Headers["X-Demo-UserId"].ToString();
        return long.TryParse(header, out var userId) ? userId : 1;
    }
}
