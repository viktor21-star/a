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
        IReadOnlyList<BakingPlanCardDto> manualPlans;
        try
        {
            manualPlans = manualPlanningStore.GetAll();
        }
        catch
        {
            manualPlans = [];
        }

        var plans = demoDataService.GetPlans().Concat(manualPlans).ToArray();
        return Task.FromResult<IReadOnlyList<BakingPlanCardDto>>(plans);
    }

    public Task<BakingPlanCardDto> CreateManualPlanAsync(CreateManualPlanRequest request, CancellationToken cancellationToken = default)
    {
        var locationName = demoDataService.GetLocationName(request.LocationId);
        try
        {
            return Task.FromResult(manualPlanningStore.Add(request, locationName));
        }
        catch
        {
            return Task.FromResult(new BakingPlanCardDto(
                DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                DateOnly.FromDateTime(DateTime.Today),
                request.LocationId,
                locationName,
                request.Mode == "pecenjara" ? "Печењара" : "Пекара",
                request.PlannedTime,
                request.Mode == "pecenjara" ? "Печењара" : "Пекара",
                0,
                request.PlannedQty,
                request.Mode,
                "рачно"));
        }
    }
}
