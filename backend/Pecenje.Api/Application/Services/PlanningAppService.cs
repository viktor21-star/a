using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Planning;

namespace Pecenje.Api.Application.Services;

public sealed class PlanningAppService(
    IPlanningRepository planningRepository,
    LocationAccessAppService locationAccessAppService,
    AdminAccessAppService adminAccessAppService)
{
    public async Task<IReadOnlyList<BakingPlanCardDto>> GetPlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await planningRepository.GetDailyPlansAsync(cancellationToken);

        try
        {
            adminAccessAppService.EnsureAdmin();
            return plans;
        }
        catch
        {
        }

        var allowedLocationIds = await locationAccessAppService.GetAllowedLocationIdsAsync(cancellationToken);
        return plans.Where(x => allowedLocationIds.Contains(x.LocationId)).ToList();
    }

    public Task<BakingPlanCardDto> CreateManualPlanAsync(CreateManualPlanRequest request, CancellationToken cancellationToken = default)
        => planningRepository.CreateManualPlanAsync(request, cancellationToken);

    public Task<BakingPlanCardDto> UpdateManualPlanAsync(long planHeaderId, UpdateManualPlanRequest request, CancellationToken cancellationToken = default)
        => planningRepository.UpdateManualPlanAsync(planHeaderId, request, cancellationToken);

    public Task DeleteManualPlanAsync(long planHeaderId, CancellationToken cancellationToken = default)
        => planningRepository.DeleteManualPlanAsync(planHeaderId, cancellationToken);

    public Task<BakingPlanCardDto> UpdateManualPlanStatusAsync(long planHeaderId, string status, CancellationToken cancellationToken = default)
        => planningRepository.UpdateManualPlanStatusAsync(planHeaderId, status, cancellationToken);
}
