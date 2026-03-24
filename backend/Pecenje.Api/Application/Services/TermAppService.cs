using Pecenje.Api.Contracts.MasterData;
using Pecenje.Api.Infrastructure.Demo;

namespace Pecenje.Api.Application.Services;

public sealed class TermAppService(InMemoryTermStore store)
{
    public Task<IReadOnlyList<TermEntryDto>> GetTermsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return Task.FromResult(store.GetAll());
        }
        catch
        {
            return Task.FromResult<IReadOnlyList<TermEntryDto>>(
            [
                new("term-0600", "Утрински", "06:00", true),
                new("term-1000", "Претпладне", "10:00", true),
                new("term-1400", "Попладне", "14:00", true)
            ]);
        }
    }

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

        try
        {
            return Task.FromResult(store.ReplaceAll(sanitized));
        }
        catch
        {
            return Task.FromResult<IReadOnlyList<TermEntryDto>>(sanitized);
        }
    }

    private static string CreateId(string label, string time)
        => $"{time}-{label}".ToLowerInvariant().Replace(' ', '-');
}
