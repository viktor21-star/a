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
        var plans = demoDataService.GetPlans().Concat(manualPlanningStore.GetAll()).ToArray();
        return Task.FromResult<IReadOnlyList<BakingPlanCardDto>>(plans);
    }

    public Task<BakingPlanCardDto> CreateManualPlanAsync(CreateManualPlanRequest request, CancellationToken cancellationToken = default)
    {
        var locationName = demoDataService.GetLocationName(request.LocationId);
        return Task.FromResult(manualPlanningStore.Add(request, locationName));
    }
}
