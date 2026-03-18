using Pecenje.Api.Application.Abstractions;

namespace Pecenje.Api.Application.Services;

public sealed class AdminAccessAppService(ICurrentUserProvider currentUserProvider)
{
    public void EnsureAdmin()
    {
        var currentUserId = currentUserProvider.GetCurrentUserId();
        if (currentUserId != 1)
        {
            throw new UnauthorizedAccessException("Само администратор може да ја стартува оваа акција.");
        }
    }
}
