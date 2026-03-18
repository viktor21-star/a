namespace Pecenje.Api.Contracts.Common;

public sealed record ApiEnvelope<T>(
    T Data,
    object? Meta = null,
    IReadOnlyList<ApiError>? Errors = null
);

public sealed record ApiError(
    string Code,
    string Message
);
