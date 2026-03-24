using Pecenje.Api.Application.Abstractions;
using Pecenje.Api.Contracts.Planning;
using Pecenje.Api.Services;

namespace Pecenje.Api.Infrastructure.Demo;

public sealed class DemoPlanningRepository(
    DemoDataService demoDataService,
    InMemoryManualPlanningStore manualPlanningStore) : IPlanningRepository
{
    public Task<IReadOnlyList<BakingPlanCardDto>> GetDailyPlansAsync(CancellationToken cancellationToken = default)
    {
        var manualPlans = manualPlanningStore.GetAll();
        var plans = demoDataService.GetPlans().Concat(manualPlans).ToArray();
        return Task.FromResult<IReadOnlyList<BakingPlanCardDto>>(plans);
    }

    public Task<BakingPlanCardDto> CreateManualPlanAsync(CreateManualPlanRequest request, CancellationToken cancellationToken = default)
    {
        var locationName = demoDataService.GetLocationName(request.LocationId);
        return Task.FromResult(manualPlanningStore.Add(request, locationName));
    }

    public Task<BakingPlanCardDto> UpdateManualPlanAsync(long planHeaderId, UpdateManualPlanRequest request, CancellationToken cancellationToken = default)
    {
        var locationName = demoDataService.GetLocationName(request.LocationId);
        return Task.FromResult(manualPlanningStore.Update(planHeaderId, request, locationName));
    }

    public Task DeleteManualPlanAsync(long planHeaderId, CancellationToken cancellationToken = default)
    {
        manualPlanningStore.Delete(planHeaderId);
        return Task.CompletedTask;
    }

    public Task<BakingPlanCardDto> UpdateManualPlanStatusAsync(long planHeaderId, string status, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(manualPlanningStore.UpdateStatus(planHeaderId, status));
    }
}
