using Pecenje.Api.Contracts.Planning;

namespace Pecenje.Api.Application.Abstractions;

public interface IPlanningRepository
{
    Task<IReadOnlyList<BakingPlanCardDto>> GetDailyPlansAsync(CancellationToken cancellationToken = default);
}
