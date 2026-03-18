using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Planning;

namespace Pecenje.Api.Application.Services;

public sealed class PlanningAppService(
    IPlanningRepository planningRepository,
    LocationAccessAppService locationAccessAppService)
{
    public async Task<IReadOnlyList<BakingPlanCardDto>> GetPlansAsync(CancellationToken cancellationToken = default)
    {
        var allowedLocationIds = await locationAccessAppService.GetAllowedLocationIdsAsync(cancellationToken);
        var plans = await planningRepository.GetDailyPlansAsync(cancellationToken);
        return plans.Where(x => allowedLocationIds.Contains(x.LocationId)).ToList();
    }
}
