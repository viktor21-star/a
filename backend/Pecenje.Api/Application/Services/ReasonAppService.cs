using Pecenje.Api.Contracts.MasterData;
using Pecenje.Api.Infrastructure.Demo;

namespace Pecenje.Api.Application.Services;

public sealed class ReasonAppService(InMemoryReasonStore store)
{
    public Task<IReadOnlyList<ReasonEntryDto>> GetReasonsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return Task.FromResult(store.GetAll());
        }
        catch
        {
            return Task.FromResult<IReadOnlyList<ReasonEntryDto>>(
            [
                new ReasonEntryDto("reason-shortage", "R001", "Недоволна количина", "разлика", true),
                new ReasonEntryDto("reason-waste", "R002", "Технолошки отпад", "отпад", true),
                new ReasonEntryDto("reason-delay", "R003", "Доцнење на печење", "доцнење", true)
            ]);
        }
    }

    public Task<IReadOnlyList<ReasonEntryDto>> SaveReasonsAsync(UpdateReasonsRequest request, CancellationToken cancellationToken = default)
    {
        var sanitized = (request.Reasons ?? [])
            .Where(entry => !string.IsNullOrWhiteSpace(entry.Code) && !string.IsNullOrWhiteSpace(entry.Name))
            .GroupBy(entry => entry.Id)
            .Select(group => group.Last())
            .Select(entry => new ReasonEntryDto(
                string.IsNullOrWhiteSpace(entry.Id) ? CreateId(entry.Code, entry.Name) : entry.Id,
                entry.Code.Trim(),
                entry.Name.Trim(),
                NormalizeCategory(entry.Category),
                entry.IsActive))
            .ToArray();

        try
        {
            return Task.FromResult(store.ReplaceAll(sanitized));
        }
        catch
        {
            return Task.FromResult<IReadOnlyList<ReasonEntryDto>>(sanitized);
        }
    }

    private static string CreateId(string code, string name)
        => $"{code}-{name}".ToLowerInvariant().Replace(' ', '-');

    private static string NormalizeCategory(string category)
        => category switch
        {
            "разлика" => "разлика",
            "отпад" => "отпад",
            "доцнење" => "доцнење",
            _ => "разлика"
        };
}
