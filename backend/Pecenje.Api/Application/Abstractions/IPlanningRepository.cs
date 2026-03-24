using Pecenje.Api.Contracts.Planning;

namespace Pecenje.Api.Application.Abstractions;

public interface IPlanningRepository
{
    Task<IReadOnlyList<BakingPlanCardDto>> GetDailyPlansAsync(CancellationToken cancellationToken = default);
    Task<BakingPlanCardDto> CreateManualPlanAsync(CreateManualPlanRequest request, CancellationToken cancellationToken = default);
    Task<BakingPlanCardDto> UpdateManualPlanAsync(long planHeaderId, UpdateManualPlanRequest request, CancellationToken cancellationToken = default);
    Task DeleteManualPlanAsync(long planHeaderId, CancellationToken cancellationToken = default);
    Task<BakingPlanCardDto> UpdateManualPlanStatusAsync(long planHeaderId, string status, CancellationToken cancellationToken = default);
}
