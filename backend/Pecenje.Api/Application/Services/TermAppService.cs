using Pecenje.Api.Contracts.MasterData;
using Pecenje.Api.Infrastructure.Demo;

namespace Pecenje.Api.Application.Services;

public sealed class TermAppService(InMemoryTermStore store)
{
    public Task<IReadOnlyList<TermEntryDto>> GetTermsAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(store.GetAll());

    public Task<IReadOnlyList<TermEntryDto>> SaveTermsAsync(UpdateTermsRequest request, CancellationToken cancellationToken = default)
    {
        var sanitized = (request.Terms ?? [])
            .Where(entry => !string.IsNullOrWhiteSpace(entry.Label) && !string.IsNullOrWhiteSpace(entry.Time))
            .GroupBy(entry => entry.Id)
            .Select(group => group.Last())
            .Select(entry => new TermEntryDto(
                string.IsNullOrWhiteSpace(entry.Id) ? CreateId(entry.Label, entry.Time) : entry.Id,
                entry.Label.Trim(),
                entry.Time.Trim(),
                entry.IsActive))
            .ToArray();

        return Task.FromResult(store.ReplaceAll(sanitized));
    }

    private static string CreateId(string label, string time)
        => $"{time}-{label}".ToLowerInvariant().Replace(' ', '-');
}
