namespace Pecenje.Api.Application.Abstractions;

public interface ICurrentUserProvider
{
    long GetCurrentUserId();
}
